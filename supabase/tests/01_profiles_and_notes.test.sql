-- Profiles and the notes example: everyone sees and changes only their own rows.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

-- Sign in as someone (sets auth.uid()) and act as the API's client role.
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

insert into auth.users (id, email, raw_user_meta_data) values
  (pg_temp.uid('ana'), 'ana@example.com', '{"display_name": "Ana"}'),
  (pg_temp.uid('ben'), 'ben@example.com', '{}');

-- --- Profiles ---------------------------------------------------------------
select is((select display_name from public.profiles where id = pg_temp.uid('ana')), 'Ana',
  'new users get a profile with their chosen name');
select is((select display_name from public.profiles where id = pg_temp.uid('ben')), 'ben',
  'without a name, the profile uses the start of their email');

select pg_temp.as_user('ana');
select is((select count(*)::int from public.profiles), 1, 'you only see your own profile');
select lives_ok($$ update public.profiles set display_name = 'Ana B' where id = pg_temp.uid('ana') $$,
  'you can rename yourself');
update public.profiles set display_name = 'Hacked' where id = pg_temp.uid('ben');
select throws_ok($$ update public.profiles set created_at = now() where id = pg_temp.uid('ana') $$,
  '42501', NULL, 'only the display name can be changed');
reset role;
select is((select display_name from public.profiles where id = pg_temp.uid('ben')), 'ben',
  'you cannot rename someone else');

-- --- Notes ------------------------------------------------------------------
select pg_temp.as_user('ana');
insert into public.notes (body) values ('Buy milk'), ('Call the bank');
select is((select count(*)::int from public.notes where user_id = pg_temp.uid('ana')), 2,
  'notes are owned by whoever adds them');
select throws_ok($$ insert into public.notes (body, user_id) values ('x', pg_temp.uid('ben')) $$,
  '42501', NULL, 'you cannot add a note for someone else');
select throws_ok($$ insert into public.notes (body) values ('   ') $$,
  '23514', NULL, 'a note needs some text');
update public.notes set done = true where body = 'Buy milk';
reset role;

select pg_temp.as_user('ben');
select is((select count(*)::int from public.notes), 0, 'you cannot see other people''s notes');
update public.notes set body = 'Hacked';
delete from public.notes;
select throws_ok($$ update public.notes set user_id = pg_temp.uid('ben') $$,
  '42501', NULL, 'nobody can move a note to another owner');
reset role;
select is((select count(*)::int from public.notes where user_id = pg_temp.uid('ana') and body <> 'Hacked'), 2,
  'you cannot change or delete other people''s notes');

-- --- clear_done_notes -------------------------------------------------------
select pg_temp.as_user('ben');
select is(public.clear_done_notes(), 0, 'clearing only touches your own notes');
reset role;
select pg_temp.as_user('ana');
select is(public.clear_done_notes(), 1, 'clear_done_notes removes your finished notes');
select is((select count(*)::int from public.notes), 1, '...and keeps the open ones');
reset role;

select ok(not has_function_privilege('anon', 'public.clear_done_notes()', 'execute'),
  'signed-out visitors cannot call it');

select * from finish();
rollback;
