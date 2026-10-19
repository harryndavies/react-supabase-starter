-- Profile pictures in Storage.
--
-- The bucket is private: files are only reachable through short-lived signed
-- URLs, and each person can only touch files in their own folder
-- (avatars/<user id>/...). Use the same pattern for any user files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']);

create policy "avatars: read your own" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: upload to your own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: replace your own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: delete your own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Which file is someone's current picture. It can only point into their own folder.
alter table public.profiles
  add column avatar_path text
  check (avatar_path is null or (avatar_path like id::text || '/%' and char_length(avatar_path) < 200));

grant update (avatar_path) on public.profiles to authenticated;
