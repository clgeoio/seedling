# Seedling

Scaffold a full-stack Cloudflare Workers starter kit with React Router 7, Better Auth, Drizzle, and D1.

## Quick Start

```bash
npx github:clgeoio/seedling create my-app
```

Or skip all prompts and use defaults:

```bash
npx github:clgeoio/seedling create my-app --yes
```

## What You Get

A production-ready full-stack app deployed to Cloudflare Workers, with:

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| Runtime         | Cloudflare Workers                               |
| Framework       | React Router 7 (SSR, file-based routing)         |
| Database        | Cloudflare D1 (SQLite) + Drizzle ORM             |
| Auth            | Better Auth (email/password, social, sessions)   |
| Email           | Resend                                           |
| Storage         | Cloudflare KV (sessions) + R2 (images, optional) |
| Styling         | TailwindCSS v4 + shadcn/ui                       |
| Formatter       | oxfmt                                            |
| Linter          | oxlint                                           |
| Package Manager | pnpm                                             |

### Always Included

- Email/password authentication with verification and password reset
- Username plugin support
- Session management via KV
- Settings pages (account, password, appearance, sessions, connections)
- Structured logging with request ID middleware
- Trailing-slash redirect middleware
- Toast notifications (Sonner)
- Light/dark theme switching with system preference detection
- Database migrations and seed scripts
- Git hooks (Lefthook) + commit linting (commitlint)

### Optional Features (CLI Prompts)

| Feature               | Default | Description                                             |
| --------------------- | ------- | ------------------------------------------------------- |
| GitHub social auth    | on      | OAuth sign-in with GitHub                               |
| Google social auth    | on      | OAuth sign-in with Google                               |
| Admin panel           | on      | Dashboard, user management, RBAC via Better Auth        |
| Example todos         | on      | Full CRUD todo list demonstrating Drizzle + D1          |
| R2 image storage      | off     | Image upload/serve via Cloudflare R2                    |
| Cron trigger handlers | off     | Scheduled tasks (session cleanup, verification cleanup) |
| Queue handlers        | off     | Cloudflare Queues consumer for async email delivery     |

## CLI Usage

```
seedling create [project-name] [options]

Options:
  -y, --yes                  Skip prompts and use defaults
  --admin / --no-admin       Include/exclude admin panel (default: included)
  --todos / --no-todos       Include/exclude example todos (default: included)
  --r2                       Include R2 image storage (default: excluded)
  --cron                     Include cron trigger handlers (default: excluded)
  --queues                   Include queue handlers (default: excluded)
  --social <providers...>    Social auth providers: github, google (default: both)
  --no-git                   Skip git repository initialization
  --no-install               Skip pnpm install
  --no-cloudflare            Skip Cloudflare resource setup
  -h, --help                 Display help
```

When run without `--yes`, the CLI walks you through each option interactively.

With `--yes`, defaults are applied and individual flags override them:

```bash
# Defaults with R2 and cron, but no admin panel
npx github:clgeoio/seedling create my-app --yes --r2 --cron --no-admin

# Only GitHub auth, skip install
npx github:clgeoio/seedling create my-app --yes --social github --no-install
```

## Generated Project Setup

The CLI automatically:

- Generates a `.dev.vars` file with a fresh `BETTER_AUTH_SECRET`
- Optionally logs in to Cloudflare, creates D1/KV/R2/Queue resources, patches `wrangler.jsonc` with real IDs, and runs local migrations + seed

If you chose "Set up Cloudflare resources?" during scaffolding, your project is ready to run immediately:

```bash
cd my-app
# Add remaining secrets to .dev.vars (RESEND_API_KEY, OAuth credentials)
pnpm dev
```

### Configure Secrets

Edit `.dev.vars` with your remaining values for local development:

```env
BETTER_AUTH_SECRET=...     # Already generated for you
RESEND_API_KEY=             # From https://resend.com

# If GitHub social auth is enabled:
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# If Google social auth is enabled:
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

For production, use `wrangler secret put` to set each secret:

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put RESEND_API_KEY
# etc.
```

### Manual Wrangler Setup (if you skipped Cloudflare setup)

If you skipped the automated Cloudflare setup during scaffolding, create resources and update `wrangler.jsonc` manually:

- **D1 database ID** -- create via `wrangler d1 create my-app-db`
- **KV namespace ID** -- create via `wrangler kv namespace create APP_KV`
- **R2 bucket name** (if enabled) -- create via `wrangler r2 bucket create my-app-uploads`
- **Queue name** (if enabled) -- create via `wrangler queues create my-app-tasks`

Then run the local database setup:

```bash
pnpm db:migrate:local    # Apply migrations to local D1
pnpm db:seed:local       # Seed with sample data
pnpm dev                 # Start dev server at http://localhost:5173
```

## Generated Project Scripts

| Script                   | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `pnpm dev`               | Start Vite dev server                          |
| `pnpm build`             | Build for production                           |
| `pnpm preview`           | Preview production build locally via Wrangler  |
| `pnpm deploy`            | Deploy to Cloudflare Workers                   |
| `pnpm typecheck`         | Run TypeScript type checking                   |
| `pnpm lint`              | Lint with oxlint                               |
| `pnpm format`            | Format with oxfmt                              |
| `pnpm db:generate`       | Generate Drizzle migrations                    |
| `pnpm db:migrate:local`  | Apply D1 migrations locally                    |
| `pnpm db:migrate:remote` | Apply D1 migrations to production              |
| `pnpm db:seed:local`     | Seed local database                            |
| `pnpm db:seed:remote`    | Seed remote database                           |
| `pnpm db:studio`         | Open Drizzle Studio                            |
| `pnpm db:reset:local`    | Reset local database                           |
| `pnpm db:delete:local`   | Delete local `.wrangler/state`                 |
| `pnpm auth:secret`       | Generate a Better Auth secret                  |
| `pnpm auth:generate`     | Regenerate auth schema from Better Auth config |

## Project Structure

```
my-app/
├── app/
│   ├── components/ui/       # shadcn/ui components
│   ├── contexts.ts          # Typed React Router middleware contexts
│   ├── crons/               # Cron trigger handlers (optional)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities, config, validations
│   ├── middlewares/         # Auth, logger, request-id, trailing-slash
│   ├── queues/              # Queue consumers (optional)
│   ├── root.tsx             # Root layout
│   ├── routes.ts            # Route definitions
│   ├── routes/
│   │   ├── admin/           # Admin panel (optional)
│   │   ├── api/             # API routes (Better Auth, theme)
│   │   ├── auth/            # Sign in/up/out, password reset
│   │   ├── settings/        # User settings pages
│   │   ├── index.tsx        # Home page
│   │   ├── layout.tsx       # App layout with nav
│   │   ├── todos.tsx        # Todo CRUD example (optional)
│   │   └── images.ts        # R2 image proxy (optional)
│   ├── services/
│   │   ├── auth/            # Better Auth server + client config
│   │   ├── db.server.ts     # Drizzle + D1 connection
│   │   ├── email.server.ts  # Resend integration
│   │   ├── logger.server.ts # Structured logger
│   │   └── r2.server.ts     # R2 helpers (optional)
│   └── styles/app.css       # TailwindCSS v4 entry
├── drizzle/
│   ├── migrations/          # SQL migration files
│   ├── schema/              # Drizzle table definitions
│   └── seed/                # Seed scripts (TypeScript + SQL)
├── workers/app.ts           # Cloudflare Worker entry point
├── wrangler.jsonc            # Wrangler configuration
├── vite.config.ts
├── react-router.config.ts
├── tsconfig.json
└── package.json
```

## Deployment

If you used the automated Cloudflare setup, your resources already exist. Just set production secrets and deploy:

```bash
# Set production secrets
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put RESEND_API_KEY

# Deploy
pnpm db:migrate:remote
pnpm deploy
```

For gradual rollouts, use versioned deployments:

```bash
pnpm deploy:version    # Upload a new version
pnpm deploy:promote    # Promote to production traffic
```

## Contributing

```bash
git clone https://github.com/clgeoio/seedling.git
cd seedling
pnpm install
pnpm build
pnpm test
```

### Testing

Tests run with Vitest across four layers:

- **Unit tests** -- template engine logic (variable substitution, conditionals, JSON cleanup)
- **Snapshot tests** -- verify generated file trees for different feature combinations
- **Build verification** -- scaffold a project, install deps, run typegen + tsc + react-router build
- **Smoke tests** -- scaffold, start dev server, verify HTTP responses for key routes

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
```

## License

MIT
