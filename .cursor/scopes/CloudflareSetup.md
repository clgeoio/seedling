# Cloudflare Setup Integration

## Purpose & User Problem

After scaffolding a project, users currently face a manual multi-step process before they can run `pnpm dev`:

1. Create D1 database via `wrangler d1 create`
2. Create KV namespace via `wrangler kv namespace create`
3. Optionally create R2 bucket, Queue
4. Copy-paste resource IDs into `wrangler.jsonc`
5. Run `pnpm db:migrate:local`
6. Run `pnpm db:seed:local`

This is error-prone and tedious. The CLI should handle all of this so that after `seedling create`, the user can immediately `pnpm dev`.

## Success Criteria

- After `seedling create my-app`, the local dev environment is fully functional -- `pnpm dev` works immediately
- Cloudflare resources (D1, KV, R2, Queues) are created automatically with correct names
- `wrangler.jsonc` is patched with real resource IDs (no more `YOUR_*_ID` placeholders)
- Local D1 has migrations applied and seed data loaded
- Auth failures are handled gracefully with clear messaging
- Users can opt out of Cloudflare setup (e.g. offline, no account yet)

## Scope

### New Prompt

Add a `setupCloudflare` confirm prompt to `gatherOptions`:
- Message: `"Set up Cloudflare resources? (requires wrangler login)"`
- Default: `true`
- Skipped (set to `false`) when `--yes` flag is used, since interactive auth can't be automated

### New Type Field

Add `setupCloudflare: boolean` to `ProjectOptions`.

### New Module: `src/cloudflare-setup.ts`

Encapsulates all Cloudflare resource creation logic. Exported function:

```typescript
export async function setupCloudflare(options: ProjectOptions, targetDir: string): Promise<void>
```

#### Flow

1. **Auth Check** -- run `wrangler whoami` (via `pnpm exec wrangler whoami` in `targetDir`)
   - If exit code 0 → already authenticated:
     - Parse and display the account name/email from the output
     - Prompt: `"Logged in as <account>. Use this account?"` (confirm, default true)
     - If user says no → run `wrangler login` with `stdio: "inherit"` to switch accounts, then re-check
     - If user confirms → continue
   - If exit code non-zero → prompt user to log in:
     - Run `wrangler login` with `stdio: "inherit"` so the browser flow works
     - After login completes, re-run `wrangler whoami` to verify and display account
     - If still failing → log error, bail out of Cloudflare setup (don't crash the whole CLI)

2. **Create D1 Database** -- `wrangler d1 create <projectName>-db`
   - Parse stdout for `database_id = "..."` using regex
   - If command fails (e.g. already exists) → log warning, prompt user to enter ID manually or skip
   - Store the extracted database ID

3. **Create KV Namespace** -- `wrangler kv namespace create APP_KV`
   - Parse stdout for `id = "..."` using regex
   - Same error handling as D1
   - Store the extracted namespace ID

4. **Create R2 Bucket** (if `options.includeR2`) -- `wrangler r2 bucket create <projectName>-uploads`
   - No ID parsing needed (R2 uses bucket names, already in template)
   - Log success or warning on failure

5. **Create Queue** (if `options.includeQueues`) -- `wrangler queues create <projectName>-tasks`
   - No ID parsing needed (Queues use names, already in template)
   - Log success or warning on failure

6. **Patch `wrangler.jsonc`** -- string-replace the placeholder IDs:
   - `"YOUR_D1_DATABASE_ID"` → actual D1 database ID
   - `"YOUR_KV_NAMESPACE_ID"` → actual KV namespace ID
   - Use simple string replacement (not JSON parse/stringify) to preserve jsonc formatting

7. **Run Local Migrations** -- `pnpm db:migrate:local`
   - `execSync` with `cwd: targetDir`, `stdio: "inherit"`
   - On failure → log warning, don't crash

8. **Run Local Seed** -- `pnpm db:seed:local`
   - Same approach as migrations
   - On failure → log warning, don't crash

### Changes to `src/prompts.ts`

Add `setupCloudflare` to the `p.group` prompts, after `installDeps`:

```typescript
setupCloudflare: () =>
  p.confirm({
    message: "Set up Cloudflare resources? (requires wrangler login)",
    initialValue: true,
  }),
```

In the `--yes` skip path, set `setupCloudflare: false`.

### Changes to `src/post-scaffold.ts`

After deps are installed, if `options.setupCloudflare` is true:
1. Call `setupCloudflare(options, targetDir)`
2. Adjust the "next steps" note to reflect what's already done

The "next steps" should dynamically omit steps that were completed:
- If Cloudflare was set up → omit "Update wrangler.jsonc with your Cloudflare resource IDs"
- If Cloudflare was set up → omit "pnpm db:migrate:local" and "pnpm db:seed:local"
- Always show "Add your secrets to .dev.vars" (RESEND_API_KEY, OAuth credentials are still manual)

### Changes to `src/types.ts`

```typescript
export interface ProjectOptions {
  // ... existing fields ...
  setupCloudflare: boolean;
}
```

## Wrangler Output Parsing

### D1 Create

```
✅ Successfully created DB '<name>'
[[d1_databases]]
binding = "DB"
database_name = "<name>"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Regex: `/database_id\s*=\s*"([^"]+)"/`

### KV Namespace Create

```
🌀 Creating namespace "APP_KV"
✅ Success!
Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "APP_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Regex: `/id\s*=\s*"([^"]+)"/`

## Error Handling Strategy

- **No wrangler available**: This shouldn't happen since wrangler is a devDependency installed in the prior step. If deps weren't installed, skip Cloudflare setup with a warning.
- **Auth failure**: Log a clear message explaining the user needs a Cloudflare account. Don't crash -- fall back to the current manual flow.
- **Resource already exists**: Wrangler errors out. Catch the error, log a warning, and give the user the option to enter the ID manually via a `p.text` prompt.
- **Network failure**: Catch, log warning, skip Cloudflare setup gracefully.
- **Migration/seed failure**: Log warning with the manual command to run. Don't crash.

The guiding principle: Cloudflare setup is best-effort. Failures degrade to the current manual experience, never crash the CLI.

## Technical Considerations

- All wrangler commands run with `cwd: targetDir` so they pick up the project's `wrangler.jsonc`
- Use `pnpm exec wrangler` (not global `wrangler`) since it's a devDependency
- `wrangler login` must use `stdio: "inherit"` for the interactive browser auth flow
- `wrangler.jsonc` patching uses string replacement, not JSON parsing, to preserve comments and formatting
- The `setupCloudflare` prompt is gated on `installDeps` being true (can't run wrangler without deps)

## Out of Scope

- Remote deployment (remains a manual step)
- Setting production secrets (`wrangler secret put`)
- Populating `.dev.vars` with OAuth credentials (GITHUB_CLIENT_ID, etc.) -- these require external service setup
- Creating Cloudflare account
- Custom resource naming (uses `<projectName>-db`, `APP_KV`, etc.)
