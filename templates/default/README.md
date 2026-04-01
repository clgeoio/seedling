# {{displayName}}

A full-stack web application built on [Cloudflare Workers](https://workers.cloudflare.com/) with React Router 7, Better Auth, Drizzle ORM, and D1.

## Getting started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your secrets

# Run database migrations
pnpm db:migrate:local

# Seed the database
pnpm db:seed:local

# Start the dev server
pnpm dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm deploy` | Deploy to Cloudflare Workers |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Lint with oxlint |
| `pnpm format` | Format with oxfmt |
| `pnpm db:migrate:local` | Apply migrations locally |
| `pnpm db:migrate:remote` | Apply migrations to production |
| `pnpm db:generate` | Generate migration after schema change |
| `pnpm db:studio` | Open Drizzle Studio |

## Deployment

```bash
# Deploy to Cloudflare Workers
pnpm deploy

# Apply migrations to production
pnpm db:migrate:remote
```

Set production secrets with `wrangler secret put <NAME>`. See `.dev.vars.example` for required variables.
