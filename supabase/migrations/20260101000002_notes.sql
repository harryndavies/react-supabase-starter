-- Example feature: notes. Delete or rename it when you start your own app.
--
-- It shows both ways of writing data:
--  * plain table access, guarded by row level security and column grants
--    (add, edit, tick off and delete a note);
--  * an RPC for anything multi-step or that needs rules beyond RLS
--    (clear_done_notes).

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_created_idx on public.notes (user_id, created_at desc);

create trigger notes_updated_at before update on public.notes
  for each row execute function private.set_updated_at();

alter table public.notes enable row level security;

create policy "notes: read your own" on public.notes for select to authenticated
  using (user_id = auth.uid());
create policy "notes: add your own" on public.notes for insert to authenticated
  with check (user_id = auth.uid());
create policy "notes: change your own" on public.notes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notes: delete your own" on public.notes for delete to authenticated
  using (user_id = auth.uid());

-- Owners and timestamps are set by the database, never by the client.
revoke insert, update on public.notes from anon, authenticated;
grant insert (body) on public.notes to authenticated;
grant update (body, done) on public.notes to authenticated;

-- Deletes the caller's finished notes and says how many went.
create function public.clear_done_notes()
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_count integer;
begin
  delete from public.notes where user_id = v_uid and done;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke execute on function public.clear_done_notes() from public, anon;
grant execute on function public.clear_done_notes() to authenticated;
