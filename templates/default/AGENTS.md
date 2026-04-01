# AGENTS.md

## What is this?

{{displayName}} is a full-stack web application built on Cloudflare Workers.

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Cloudflare Workers |
| Framework | React Router 7 (SSR) |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Auth | Better Auth (email/password, social, sessions) |
| Email | Resend |
| Storage | Cloudflare KV (sessions) |
| Styling | TailwindCSS v4 + shadcn/ui |
| Linter | oxlint |
| Formatter | oxfmt |

## Quick commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server at http://localhost:5173 |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build via Wrangler |
| `pnpm deploy` | Deploy to Cloudflare Workers |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Lint with oxlint |
| `pnpm format` | Format with oxfmt |
| `pnpm db:migrate:local` | Apply D1 migrations locally |
| `pnpm db:migrate:remote` | Apply D1 migrations to production |
| `pnpm db:seed:local` | Seed local database |
| `pnpm db:generate` | Generate new Drizzle migration after schema change |
| `pnpm db:reset:local` | Reset and re-migrate local database |
| `pnpm db:studio` | Open Drizzle Studio for database inspection |

## Project structure

| Path | Purpose |
|------|---------|
| `workers/app.ts` | Cloudflare Worker entry point (fetch, scheduled, queue handlers) |
| `app/routes.ts` | Route definitions (file-based routing config) |
| `app/routes/` | React Router route modules |
| `app/routes/api/` | API routes (Better Auth, theme switcher) |
| `app/routes/auth/` | Auth pages (sign-in, sign-up, password reset) |
| `app/routes/settings/` | User settings pages |
| `app/services/` | Server-side services |
| `app/services/auth/` | Better Auth server config + client |
| `app/services/db.server.ts` | Drizzle + D1 database connection |
| `app/services/env.server.ts` | Environment variable validation |
| `app/services/email.server.ts` | Resend email integration |
| `app/services/logger.server.ts` | Structured logger |
| `app/middlewares/` | Request middleware stack |
| `app/components/ui/` | shadcn/ui components |
| `app/lib/` | Utilities, config, validations |
| `app/contexts.ts` | Typed React Router middleware contexts |
| `drizzle/schema/` | Database table definitions (Drizzle ORM) |
| `drizzle/migrations/` | SQL migration files |
| `drizzle/seed/` | Database seed scripts |

## Key patterns

- **Server-only modules** use `.server.ts` suffix — never import these in client components
- **Auth client** is at `app/services/auth/client.ts` (browser-side), **auth server** at `app/services/auth/auth.server.ts`
- **Environment variables** are validated in `app/services/env.server.ts`
- **Database access** via `app/services/db.server.ts` using Drizzle ORM with D1
- **Middleware context** is typed in `app/contexts.ts` and available in route loaders/actions
- **Path alias** `~/` maps to the `app/` directory

## Environment

Secrets are stored in `.dev.vars` for local development. See `.dev.vars.example` for required variables.

For production, set secrets via `wrangler secret put <NAME>`.

## Constraints

- Never use `any` types
- Use `~/` path alias for imports from the `app/` directory
- `*.server.ts` files are server-only — never import them in client components
- Database schema changes require a new migration: edit `drizzle/schema/`, then run `pnpm db:generate`
