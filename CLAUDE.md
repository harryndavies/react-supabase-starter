# Project notes for coding agents

React 19 + Vite + TypeScript, TanStack Router (file-based) and TanStack Query, Supabase,
Tailwind v4, Zod. See README.md for the full picture.

## Commands

- `npm run db:start` then `npm run dev`. `npm test`, `npm run test:db`, `npm run typecheck`,
  `npm run lint`, `npm run format`.
- After any migration: `npm run db:reset && npm run db:types`.

## Conventions

- Schema changes only as new files in `supabase/migrations/`. Every table: RLS on, policies
  for exactly what's needed, column-level grants for client writes. Add a pgTAP test.
- Multi-step writes are `security definer` RPCs with `set search_path = ''`, which raise short
  codes; add new codes to `src/lib/errors.ts`. Call them through `rpc` / `rpcParsed`.
- Features live in `src/features/<name>/` (schemas, queries, components, tests). Query keys
  include the user id. Parse API data with Zod.
- Signed-in pages go under `src/routes/_app/` and get the session from `useSession()`.
- Style with the tokens in `src/index.css` (`bg-surface`, `text-muted`, …), not raw colours.
- In pgTAP, check privileges with `has_function_privilege` instead of calling a refused
  function after `set role`: some local Postgres images crash on that.
