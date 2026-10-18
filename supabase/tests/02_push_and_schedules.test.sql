-- Push subscriptions and the scheduled reminder.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

create function pg_temp.uid(p_who text) returns uuid language sql immutable as $$
  select case p_who when 'ana' then '00000000-0000-0000-0000-00000000000a'::uuid
                    else '00000000-0000-0000-0000-00000000000b'::uuid end
$$;
create function pg_temp.as_user(p_who text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', pg_temp.uid(p_who), 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end;
$$;
grant execute on all functions in schema pg_temp to authenticated;
insert into auth.users (id, email) values (pg_temp.uid('ana'), 'ana@example.com'), (pg_temp.uid('ben'), 'ben@example.com');

select pg_temp.as_user('ana');
select lives_ok($$ select public.save_push_subscription('https://push.example/ana', 'p256', 'auth') $$,
  'you can save this device''s subscription');
select throws_ok($$ select * from public.push_subscriptions $$, '42501', NULL,
  'clients cannot read subscriptions directly');
reset role;

-- The same device signing in as someone else moves the subscription to them.
select pg_temp.as_user('ben');
select public.save_push_subscription('https://push.example/ana', 'p256', 'auth');
reset role;
select is((select user_id from public.push_subscriptions where endpoint = 'https://push.example/ana'),
  pg_temp.uid('ben'), 'a device''s subscription follows whoever signed in last');

select pg_temp.as_user('ana');
select public.delete_push_subscription('https://push.example/ana');
reset role;
select is((select count(*)::int from public.push_subscriptions), 1, 'you cannot delete someone else''s');
select pg_temp.as_user('ben');
select public.delete_push_subscription('https://push.example/ana');
reset role;
select is((select count(*)::int from public.push_subscriptions), 0, 'you can delete your own');

-- Privileges are checked directly: calling a refused function from a SET ROLE
-- session crashes some local Postgres images. Through the API it is refused normally.
select ok(not has_function_privilege('authenticated', 'public.drop_push_subscriptions(text[])', 'execute'),
  'only the Edge Function can drop subscriptions');
select ok(not has_function_privilege('authenticated', 'private.notify_users(uuid[], text, text, text)', 'execute'),
  'users cannot send notifications');

select is((select count(*)::int from cron.job where jobname = 'starter-remind-open-notes'), 1,
  'the daily reminder is scheduled');
select is(private.remind_open_notes(), 0, 'with nobody subscribed, the reminder sends nothing');

select * from finish();
rollback;
