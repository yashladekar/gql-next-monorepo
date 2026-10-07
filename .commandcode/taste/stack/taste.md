# Tooling & Stack

- Works in a pnpm + Turbo monorepo using shadcn/ui for UI components. Confidence: 0.75
- Preferred stack: Next.js App Router, TypeScript, GraphQL, Prisma + PostgreSQL, TanStack React Query (not Apollo), and Better Auth (or Auth.js/NextAuth if already present). Confidence: 0.75
- Uses OpenFGA as the external fine-grained authorization engine, with a model authored as the authorization source of truth. Confidence: 0.75
- Prefers Docker Compose for local infrastructure (e.g. PostgreSQL, OpenFGA) and simple pnpm scripts for setup workflows (db:generate/migrate/seed, fga:setup, dev). Confidence: 0.7
- In a monorepo, prefers shared backend concerns isolated in dedicated workspace packages (e.g. packages/db for Prisma, packages/authz for the authorization service) rather than living inside the app. Confidence: 0.6
