# FGAC Admin (`apps/admin`)

An administration console for the FGAC reference app. It combines two panels behind a
single shadcn/ui Next.js App Router app:

- **OpenFGA admin** — stores, authorization models (read/write via DSL or JSON, with a
  Monaco editor, relationship graph, and version diff), relationship tuples, an access
  explorer (Check / ListObjects / ListUsers) and a changes feed. Built natively with
  `@workspace/ui` and `@workspace/authz` (no Ant Design, no Hono gateway, no Bun).
- **Identity admin** — [Better Auth Studio](https://github.com/Kinfe123/better-auth-studio)
  embedded at `/api/studio` for managing users, organizations, teams and sessions.

Runs on **http://localhost:3003** (the web app uses 3001, the OpenFGA playground 3001 —
check `.env`).

## Run

```bash
# from the repo root
pnpm --filter admin dev     # or: pnpm dev (runs every app via Turborepo)
```

Prerequisites are the same as the web app: PostgreSQL, a running OpenFGA, and a root
`.env` populated by `pnpm setup`.

## Access control

Two independent gates, both fail closed:

| Panel | Gate |
|---|---|
| OpenFGA admin | Better Auth session **and** the OpenFGA `organization.manage` capability on at least one organization (checked in `lib/admin-guard.ts`). Every `/api/ofga/*` route handler enforces it — hiding navigation is not the boundary. |
| Better Auth Studio | The user's `role` must be `admin` **and** their email must be in `ADMIN_EMAILS` (`studio.config.ts`). Studio requires a role by design, so the `User` model carries a `role` column (`member` by default; the seed gives Alice and Bob `admin`). This column is for the admin console only — application authorization still runs entirely through OpenFGA. |

```
# .env
ADMIN_EMAILS="alice@acme.test,bob@acme.test"
```

Sign in with a seeded demo account (Alice — Owner, Bob — Admin; password `password1234`).
A plain member such as Charlie gets a 403.

## Layout

```
app/
  (app)/            gated shell: overview, stores, models, tuples, explore, changes
  (auth)/sign-in/   email + password sign-in
  api/auth/         Better Auth handler (shared config)
  api/ofga/         admin REST endpoints (guarded)
  api/studio/       embedded Better Auth Studio
components/         shell, store switcher, Monaco editor, React Flow graph, model diff
hooks/use-ofga.ts   React Query hooks over /api/ofga
lib/                auth client, admin guard, OpenFGA fetch helpers
studio.config.ts    Better Auth Studio configuration
```

## Notes

- The Better Auth instance is shared with the web app via `@workspace/auth`
  (`packages/auth`), so a session issued by one app is accepted by the other.
- `better-auth-studio` is listed under `serverExternalPackages` in `next.config.ts`
  because it lazily transpiles the auth config with Babel at runtime, which Turbopack
  cannot bundle.
- The model editor and graph are client-only and lazily loaded.
