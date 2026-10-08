# Tooling & Stack

- Works in a pnpm + Turbo monorepo using shadcn/ui for UI components. Confidence: 0.75
- Preferred stack: Next.js App Router, TypeScript, GraphQL, Prisma + PostgreSQL, TanStack React Query (not Apollo), and Better Auth (or Auth.js/NextAuth if already present). Confidence: 0.75
- Uses OpenFGA as the external fine-grained authorization engine, with a model authored as the authorization source of truth. Confidence: 0.75
- Prefers Docker Compose for local infrastructure (e.g. PostgreSQL, OpenFGA) and simple pnpm scripts for setup workflows (db:generate/migrate/seed, fga:setup, dev). Confidence: 0.7
- Wants infrastructure setup fully automated as an idempotent, one-command lifecycle exposed via pnpm scripts (e.g. install/up/down/status) — including downloading/unpacking binaries and bootstrapping state — rather than documented manual steps; values it being cross-platform (Windows/macOS/Linux). Confidence: 0.75
- In a monorepo, prefers shared backend concerns isolated in dedicated workspace packages (e.g. packages/db for Prisma, packages/authz for the authorization service) rather than living inside the app. Confidence: 0.6
- Keeps the whole workspace on one consistent UI stack/design system (shadcn/ui, with the shared UI package); rejects introducing a second component library/framework (e.g. Ant Design) — when integrating an existing open-source tool, ports/adapts it into the project's own shadcn components and service layer instead of running it standalone on a foreign stack. Confidence: 0.65
