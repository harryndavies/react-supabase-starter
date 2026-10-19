-- Avatar uploads stay in your own folder; notes are published for realtime.
-- (Storage forbids deleting files with SQL, so the delete policy is exercised
-- through the Storage API in the app instead.)
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

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
select lives_ok($$ insert into storage.objects (bucket_id, name, owner_id)
  values ('avatars', pg_temp.uid('ana') || '/me.jpg', pg_temp.uid('ana')) $$,
  'you can upload into your own folder');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('avatars', pg_temp.uid('ben') || '/me.jpg') $$, '42501', NULL,
  'you cannot upload into someone else''s folder');
select lives_ok($$ update public.profiles set avatar_path = pg_temp.uid('ana') || '/me.jpg'
  where id = pg_temp.uid('ana') $$, 'your profile can point at your own picture');
select throws_ok($$ update public.profiles set avatar_path = pg_temp.uid('ben') || '/me.jpg'
  where id = pg_temp.uid('ana') $$, '23514', NULL, 'your profile cannot point at someone else''s file');
reset role;

select pg_temp.as_user('ben');
select is((select count(*)::int from storage.objects where bucket_id = 'avatars'), 0,
  'you cannot see other people''s files');
reset role;

select is((select public from storage.buckets where id = 'avatars'), false,
  'avatars are private (signed URLs only)');
select ok(exists (select 1 from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notes'),
  'notes changes are published for realtime');

select * from finish();
rollback;
