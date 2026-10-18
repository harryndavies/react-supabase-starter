-- Web Push and scheduled jobs.
--
-- Devices save a push subscription through RPCs. The database sends
-- notifications by calling the send-push Edge Function through pg_net, with a
-- shared secret in the x-cron-secret header. The functions URL and the secret
-- live in Vault (see the README); until both exist, nothing is sent, so a fresh
-- local database stays quiet.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table public.push_subscriptions (
  endpoint text primary key check (endpoint ~ '^https://' and char_length(endpoint) < 1000),
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null check (char_length(p256dh) < 200),
  auth text not null check (char_length(auth) < 100),
  user_agent text check (user_agent is null or char_length(user_agent) < 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Only the Edge Function (service role) reads this table; clients use the RPCs.
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;

create function public.save_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  -- An endpoint belongs to one device; it follows whoever signed in there last.
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth, user_agent)
  values (p_endpoint, v_uid, p_p256dh, p_auth, left(p_user_agent, 300))
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        updated_at = now();
end;
$$;

create function public.delete_push_subscription(p_endpoint text)
returns void
language sql security definer
set search_path = ''
as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid()
$$;

-- The Edge Function removes subscriptions that browsers have expired.
create function public.drop_push_subscriptions(p_endpoints text[])
returns void
language sql security definer
set search_path = ''
as $$
  delete from public.push_subscriptions where endpoint = any (p_endpoints)
$$;

revoke execute on function public.save_push_subscription(text, text, text, text) from public, anon;
revoke execute on function public.delete_push_subscription(text) from public, anon;
revoke execute on function public.drop_push_subscriptions(text[]) from public, anon, authenticated;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;
grant execute on function public.delete_push_subscription(text) to authenticated;
grant execute on function public.drop_push_subscriptions(text[]) to service_role;

-- ---------------------------------------------------------------------------
-- Sending
-- ---------------------------------------------------------------------------

-- Calls an Edge Function with the shared secret. Does nothing until the Vault
-- secrets are set.
create function private.call_function(p_name text, p_body jsonb default '{}')
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'app_functions_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'app_cron_secret';
  if v_url is null or v_secret is null then
    raise notice 'call_function(%): Vault secrets not set, skipping', p_name;
    return;
  end if;
  perform net.http_post(
    url := rtrim(v_url, '/') || '/' || p_name,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body := p_body,
    timeout_milliseconds := 30000
  );
end;
$$;

-- Sends one notification to every device of the given users.
create function private.notify_users(p_user_ids uuid[], p_title text, p_body text, p_url text default '/')
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  -- Skip the HTTP call when none of them has turned notifications on.
  if not exists (select 1 from public.push_subscriptions where user_id = any (p_user_ids)) then
    return;
  end if;
  perform private.call_function('send-push', jsonb_build_object(
    'user_ids', to_jsonb(p_user_ids), 'title', p_title, 'body', p_body, 'url', p_url
  ));
exception when others then
  -- A notification must never break whatever caused it.
  raise warning 'notify_users failed: %', sqlerrm;
end;
$$;

revoke all on function private.call_function(text, jsonb) from public, anon, authenticated;
revoke all on function private.notify_users(uuid[], text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Example scheduled job: a daily nudge about unfinished notes
-- ---------------------------------------------------------------------------

create function private.remind_open_notes()
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  r record;
  v_sent integer := 0;
begin
  for r in
    select n.user_id, count(*) as open_count
    from public.notes n
    where not n.done
      and exists (select 1 from public.push_subscriptions s where s.user_id = n.user_id)
    group by n.user_id
  loop
    perform private.notify_users(
      array[r.user_id],
      'Still on your list',
      case when r.open_count = 1 then 'You have 1 open note.'
           else 'You have ' || r.open_count || ' open notes.' end,
      '/notes'
    );
    v_sent := v_sent + 1;
  end loop;
  return v_sent;
end;
$$;
revoke all on function private.remind_open_notes() from public, anon, authenticated;

-- Times are UTC.
select cron.schedule('starter-remind-open-notes', '0 18 * * *', $$select private.remind_open_notes()$$);
