# React + Supabase starter

A starting point for mobile-first web apps: React, TanStack Router and Query, Supabase and
Tailwind, with auth, an example feature, push notifications, tests and CI already wired up.
It's the stack behind [Last Alive](https://github.com/harryndavies/last-alive) and
[Dirty Laundry](https://github.com/harryndavies/dirty-laundry), with the app-specific parts
taken out.

**Use it:** click **Use this template** on GitHub, or
`gh repo create my-app --template harryndavies/react-supabase-starter --clone`.

## What's in the box

| Area    | What you get                                                                          |
| ------- | ------------------------------------------------------------------------------------- |
| App     | React 19, Vite, TypeScript (strict), Tailwind CSS v4 with light and dark tokens       |
| Routing | TanStack Router with file-based routes, per-route code splitting and an auth guard    |
| Data    | TanStack Query hooks, Zod validation of API responses and env vars, typed RPCs        |
| Backend | Supabase: Postgres with row level security, Auth, Edge Functions, pg_cron, pg_net     |
| Auth    | Email and password, guests (upgradable to email), password reset, account deletion    |
| Example | **Notes**: one feature showing the whole pattern, with live updates (Realtime)        |
| Files   | Profile pictures in a private Storage bucket: per-user folders, signed URLs, resizing |
| UI      | Button, TextField, Card, Avatar, a bottom Sheet and toasts                            |
| PWA     | Manifest, icons, a service worker and Web Push with a scheduled reminder              |
| Quality | ESLint, Prettier, Vitest + Testing Library, pgTAP database tests, GitHub Actions      |

## Run it locally

You need Node 22 and Docker.

```bash
npm install
npm run db:start            # local Supabase in Docker: applies the migrations
cp .env.example .env.local  # already points at the local stack
npm run dev                 # http://localhost:5173
```

Sign in as **demo@example.com** / **demo-password** (from `supabase/seed.sql`), create an
account (local email confirmation is off) or choose **Try it without an account**. Auth emails,
such as password resets, land in the local mail catcher at http://localhost:54324.

To try account deletion and push locally, also serve the Edge Functions:
`npx supabase functions serve --env-file supabase/functions/.env` (see Push notifications for
what goes in that file).

## Scripts

| Script              | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Vite dev server                                                  |
| `npm test`          | unit and component tests (Vitest)                                |
| `npm run test:db`   | database tests (pgTAP): RLS, functions, schedules                |
| `npm run typecheck` | TypeScript                                                       |
| `npm run lint`      | ESLint                                                           |
| `npm run format`    | Prettier                                                         |
| `npm run build`     | type-check, then build to `dist/`                                |
| `npm run db:reset`  | rebuild the local database from the migrations                   |
| `npm run db:types`  | regenerate `src/lib/database.types.ts` after changing the schema |

GitHub Actions runs the checks, tests, build and database tests on every push and pull request.

## How it fits together

```
src/
  routes/              file-based routes (src/routeTree.gen.ts is generated)
    __root.tsx         error and not-found pages
    sign-in.tsx        sign in, sign up, forgot password, continue as a guest
    reset-password.tsx where the reset email lands; choose a new password
    _app.tsx           layout and auth guard for everything signed in
    _app/notes.tsx     the example feature
    _app/settings.tsx  profile and picture, guest upgrade, notifications, sign out, delete account
  features/<name>/     a feature's schemas, query hooks, components and tests
  components/          shared UI: Button, TextField, Card, Avatar, Sheet, Toaster
  lib/                 env, Supabase client, auth, errors, typed RPCs, push, toasts, images
supabase/
  migrations/          the schema; never change the database by hand
  tests/               pgTAP tests
  seed.sql             local demo data (loaded by db:reset, never by db push)
  functions/
    send-push/         delivers Web Push notifications (called by the database)
    delete-account/    deletes the caller's files, then their account
public/                manifest, icons, service worker
```

### Rules the code follows

- **The database enforces the rules.** Every table has row level security, and clients get
  column-level grants for only what they may write (`grant insert (body) on notes`). Owners
  and timestamps come from defaults and triggers, never from the client.
- **Plain table writes for simple things, RPCs for the rest.** Anything multi-step, or with
  rules RLS can't express, is a `security definer` function with `search_path = ''` that raises
  short error codes (`not_signed_in`). `src/lib/errors.ts` turns those into friendly messages.
- **Validate at the edges.** Zod parses env vars at start-up, API responses in query hooks and
  forms before they submit.
- **Query keys include the user**, so one person's cache can never show for another.
- **User files go in `<bucket>/<user id>/…`** with Storage policies on that folder, and a
  private bucket read through signed URLs. Add any new bucket to `USER_BUCKETS` in
  `delete-account` so its files go when an account does.
- **Realtime changes refresh queries** rather than patching the cache by hand
  (`src/features/notes/realtime.ts`). A table needs adding to the `supabase_realtime`
  publication first.
- **Errors reach people as toasts** for background actions (`toast(message, 'error')`), and
  inline for forms.

### Adding a feature

Using notes as the template:

1. `npx supabase migration new <name>`: table, RLS policies, grants, any RPCs.
2. A pgTAP test in `supabase/tests/` proving people only see and change their own rows.
3. `npm run db:reset && npm run db:types`.
4. `src/features/<name>/`: a Zod schema, query hooks, components and their tests.
5. A route file in `src/routes/_app/` and a link in the nav (`src/routes/_app.tsx`).

When you're ready, delete the notes feature: its migrations (notes, realtime), tests,
`src/features/notes/`, the route, the reminder job and the demo notes in `supabase/seed.sql`.

## Push notifications

The database sends notifications. `private.notify_users()` calls the `send-push` Edge
Function through pg_net, with a shared secret in the `x-cron-secret` header. The example
`starter-remind-open-notes` job (pg_cron, 18:00 UTC daily) uses it to nudge people with open
notes.

1. Generate a key pair: `npx web-push generate-vapid-keys`.
2. App: set `VITE_VAPID_PUBLIC_KEY` to the public key. Without it the notifications switch is
   hidden.
3. Functions: put the keys and a secret in `supabase/functions/.env` locally (served with
   `npx supabase functions serve --env-file supabase/functions/.env`), or with
   `npx supabase secrets set` in production:
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:` or your site's URL) and
   `CRON_SECRET` (`openssl rand -hex 32`).
4. Database: store where the functions live and the same secret in Vault (SQL editor, or
   `psql` locally):

   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1', 'app_functions_url');
   select vault.create_secret('<the same CRON_SECRET>', 'app_cron_secret');
   ```

   Locally the URL is `http://host.docker.internal:54321/functions/v1`. Until both secrets
   exist, the jobs and notifications do nothing.

Check what ran with `select * from cron.job_run_details order by start_time desc limit 20;` and
the function's replies in `net._http_response`. On iPhone and iPad, Web Push only works once
the app is added to the home screen.

## Deploy

**Supabase.** Create a project, then:

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase functions deploy send-push
npx supabase functions deploy delete-account
```

In the dashboard, turn on **Authentication → Sign In / Providers → Allow anonymous sign-ins**
for guest accounts, ideally with CAPTCHA so nobody can create users in bulk. Set **Auth → URL
Configuration → Site URL** to your app's URL, and add `https://<your-domain>/**` to the redirect
URLs so confirmation and password-reset emails can link back. Then do the push setup above.

**Vercel.** Import the repo. `vercel.json` sets the Vite build, SPA rewrites and cache headers.
Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and, for push, `VITE_VAPID_PUBLIC_KEY`.

Deploy database changes **before** app code that depends on them.

## Make it yours

- Rename the app in `index.html`, `public/manifest.webmanifest` and `public/sw.js`, and replace
  the icons in `public/`.
- Restyle by changing the tokens at the top of `src/index.css`.
- Update `project_id` in `supabase/config.toml`.

## Licence

MIT
