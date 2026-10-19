-- Live updates: changes to notes are broadcast to subscribed clients. Row level
-- security still applies, so people only ever receive their own rows.
alter publication supabase_realtime add table public.notes;
