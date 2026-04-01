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

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Runtime        | Cloudflare Workers                               |
| Framework      | React Router 7 (SSR, file-based routing)         |
| Database       | Cloudflare D1 (SQLite) + Drizzle ORM             |
| Auth           | Better Auth (email/password, social, sessions)   |
| Email          | Resend                                           |
| Storage        | Cloudflare KV (sessions) + R2 (images, optional) |
| Styling        | TailwindCSS v4 + shadcn/ui                       |
| Formatter      | oxfmt                                            |
| Linter         | oxlint                                           |
| Package Manager| pnpm                                             |

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

| Feature               | Default | Description                                              |
| --------------------- | ------- | -------------------------------------------------------- |
| GitHub social auth     | on      | OAuth sign-in with GitHub                                |
| Google social auth     | on      | OAuth sign-in with Google                                |
| Admin panel            | on      | Dashboard, user management, RBAC via Better Auth         |
| Example todos          | on      | Full CRUD todo list demonstrating Drizzle + D1           |
| R2 image storage       | off     | Image upload/serve via Cloudflare R2                     |
| Cron trigger handlers  | off     | Scheduled tasks (session cleanup, verification cleanup)  |
| Queue handlers         | off     | Cloudflare Queues consumer for async email delivery      |

## CLI Usage

```
seedling create [project-name] [options]

Options:
  -y, --yes    Skip prompts and use defaults
  -h, --help   Display help
```

When run without `--yes`, the CLI walks you through each option interactively.

## Generated Project Setup

The CLI automatically generates a `.env` file from `.env.example` with a fresh `BETTER_AUTH_SECRET`. After scaffolding:

```bash
cd my-app
```

### Configure Secrets

Edit `.env` with your remaining values:

```env
BETTER_AUTH_SECRET=...     # Already generated for you
RESEND_API_KEY=             # From https://resend.com
BETTER_AUTH_ADMIN_USER_ID=  # Your user ID after first sign-up

# If GitHub social auth is enabled:
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# If Google social auth is enabled:
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Configure Wrangler

Edit `wrangler.jsonc` with your Cloudflare resource IDs:

- **D1 database ID** -- create via `wrangler d1 create my-app-db`
- **KV namespace ID** -- create via `wrangler kv namespace create APP_KV`
- **R2 bucket name** (if enabled) -- create via `wrangler r2 bucket create my-app-uploads`
- **Queue name** (if enabled) -- create via `wrangler queues create my-app-email`

### Run Locally

```bash
pnpm db:migrate:local    # Apply migrations to local D1
pnpm db:seed:local       # Seed with sample data
pnpm dev                 # Start dev server at http://localhost:5173
```

## Generated Project Scripts

| Script                  | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `pnpm dev`              | Start Vite dev server                              |
| `pnpm build`            | Build for production                               |
| `pnpm preview`          | Preview production build locally via Wrangler      |
| `pnpm deploy`           | Deploy to Cloudflare Workers                       |
| `pnpm typecheck`        | Run TypeScript type checking                       |
| `pnpm lint`             | Lint with oxlint                                   |
| `pnpm format`           | Format with oxfmt                                  |
| `pnpm db:generate`      | Generate Drizzle migrations                        |
| `pnpm db:migrate:local` | Apply D1 migrations locally                        |
| `pnpm db:migrate:remote`| Apply D1 migrations to production                  |
| `pnpm db:seed:local`    | Seed local database                                |
| `pnpm db:seed:remote`   | Seed remote database                               |
| `pnpm db:studio`        | Open Drizzle Studio                                |
| `pnpm db:reset:local`   | Reset local database                               |
| `pnpm db:delete:local`  | Delete local `.wrangler/state`                     |
| `pnpm auth:secret`      | Generate a Better Auth secret                      |
| `pnpm auth:generate`    | Regenerate auth schema from Better Auth config     |

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

```bash
# First-time setup
wrangler d1 create my-app-db
wrangler kv namespace create APP_KV

# Update wrangler.jsonc with resource IDs, then:
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
