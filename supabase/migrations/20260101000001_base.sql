-- Base: a private schema for helpers, and a profile for every user.
--
-- Conventions used throughout:
--  * Every table has row level security. Policies allow exactly what the app needs.
--  * Helpers live in the `private` schema, which the API does not expose.
--  * Functions that act for the caller raise short error codes ('not_signed_in')
--    that the app maps to messages in src/lib/errors.ts.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- The signed-in user's id, or an error. Use it at the top of RPCs.
create function private.require_uid()
returns uuid
language plpgsql stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_signed_in';
  end if;
  return v_uid;
end;
$$;
revoke all on function private.require_uid() from public;
grant execute on function private.require_uid() to authenticated;

-- Keeps updated_at current on any table that has one.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: read your own" on public.profiles for select to authenticated
  using (id = auth.uid());
create policy "profiles: update your own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Clients may only ever change the display name.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Every new user (email or guest) gets a profile.
create function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Guest'
    ), 40)
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();
