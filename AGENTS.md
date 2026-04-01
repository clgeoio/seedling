# AGENTS.md

## What is this?

`seedling` is a CLI tool that scaffolds full-stack Cloudflare Workers applications with React Router 7, Better Auth, Drizzle ORM, and D1.

## Quick commands

| Command | Purpose |
|---------|---------|
| `pnpm build` | Build the CLI (required before testing) |
| `pnpm test` | Run all tests (~5 min total) |
| `pnpm vitest run src/__tests__/scaffold.test.ts` | Fast unit tests only (~2s) |
| `pnpm vitest run src/__tests__/snapshot.test.ts` | Snapshot tests for template output |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Lint with oxlint |
| `pnpm format` | Format with oxfmt |
| `pnpm format:check` | Check formatting without writing |
| `make verify` | Build + typecheck + lint + format check + all tests |
| `make test-fast` | Build + unit + snapshot tests only |
| `make try` | Build and scaffold a test project to `/tmp/seedling-try` |

## Architecture

### Source files (`src/`)

| File | Purpose |
|------|---------|
| `index.ts` | CLI entrypoint (Commander). Parses args and flags, delegates to prompts → scaffold → post-scaffold |
| `types.ts` | `ProjectOptions`, `TemplateContext`, and `CliFlags` interfaces |
| `prompts.ts` | Interactive prompts using @clack/prompts. Gathers project options, skippable via `--yes` with flag overrides |
| `scaffold.ts` | Template engine. Copies `templates/default/`, removes conditional paths, renames dot-prefixed files, processes template variables and conditionals |
| `post-scaffold.ts` | Post-scaffold steps: generates `.dev.vars`, inits git, installs deps, runs Cloudflare setup |
| `cloudflare-setup.ts` | Optional Cloudflare resource provisioning (D1, KV, R2, Queues) via wrangler CLI |

### Template directory (`templates/default/`)

91 files forming the scaffolded project. Processed by a **custom template engine** (not Handlebars).

### Template engine conventions

- **Variable substitution:** `{{projectName}}` and `{{displayName}}` are replaced with user-provided values
- **Conditional blocks:** `{{#if featureName}}...{{/if}}` includes content when the feature is enabled
- **Inverse conditionals:** `{{#unless featureName}}...{{/unless}}` includes content when the feature is disabled
- **Comment-agnostic:** Conditionals work inside `//`, `/* */`, `--`, and `#` comment styles
- **File renaming:** Files prefixed with `_` are renamed to `.` prefix (e.g. `_gitignore` → `.gitignore`). Mapping is in `RENAME_MAP` in `scaffold.ts`
- **Conditional paths:** Entire files/directories are removed when features are disabled. Mapping is in `CONDITIONAL_PATHS` in `scaffold.ts`
- **JSON cleanup:** JSON files are auto-cleaned after processing (trailing commas removed, re-formatted with tabs)

Available feature flags for conditionals:

| Flag | Controls |
|------|----------|
| `includeAdmin` | Admin panel routes and RBAC permissions |
| `includeR2` | R2 image storage routes and service |
| `includeTodos` | Example todo CRUD routes and schema |
| `includeCron` | Cron trigger handler directory |
| `includeQueues` | Queue consumer directory |
| `hasGithub` | GitHub OAuth provider config |
| `hasGoogle` | Google OAuth provider config |
| `hasSocialAuth` | Any social auth provider enabled |

## Testing workflow

After modifying `src/` or `templates/`:

1. `pnpm build` — required, tests import compiled output
2. `pnpm vitest run src/__tests__/scaffold.test.ts` — fast unit tests for template engine logic
3. `pnpm vitest run src/__tests__/snapshot.test.ts -u` — update snapshots if template structure changed
4. `pnpm test` — full suite (build verification + smoke + auth flow, ~5 min)

## Constraints

- Never use `any` types (enforced by oxlint)
- Template files in `templates/` are excluded from oxlint and oxfmt
- `dist/` is build output from tsup — never edit directly
- Tests scaffold real projects to temp dirs — build/smoke/auth tests are slow (~2-3 min each)
- Only `.ts`, `.tsx`, `.json`, `.jsonc`, `.css`, `.html`, `.md`, `.yml`, `.yaml`, `.toml`, `.sql`, `.txt`, `.cjs`, `.mjs` files are processed by the template engine (see `TEXT_EXTENSIONS` in `scaffold.ts`)
