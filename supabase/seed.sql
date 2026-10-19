-- Local demo data, loaded by `npm run db:reset` (never by `db push`).
-- Sign in as demo@example.com with the password "demo-password".

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'demo@example.com',
  extensions.crypt('demo-password', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{"display_name": "Demo"}', now(), now(),
  '', '', '', ''
);

-- Email sign-in needs a matching identity.
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
values (
  'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
  '{"sub": "d0000000-0000-0000-0000-000000000001", "email": "demo@example.com", "email_verified": true}',
  'email', now(), now(), now()
);

-- (The profile comes from the on_auth_user_created trigger.)
insert into public.notes (user_id, body, done, created_at) values
  ('d0000000-0000-0000-0000-000000000001', 'Rename the app in index.html and the manifest', false, now() - interval '3 days'),
  ('d0000000-0000-0000-0000-000000000001', 'Swap the icons in public/', false, now() - interval '2 days'),
  ('d0000000-0000-0000-0000-000000000001', 'Delete the notes example', false, now() - interval '1 day'),
  ('d0000000-0000-0000-0000-000000000001', 'Run npm run db:start', true, now() - interval '4 days');
