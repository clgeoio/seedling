#!/usr/bin/env node

// src/index.ts
import * as p4 from "@clack/prompts";
import { Command } from "commander";

// src/prompts.ts
import * as p from "@clack/prompts";
import pc from "picocolors";
function toTitleCase(str) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function parseSocialProviders(input) {
  const valid = /* @__PURE__ */ new Set(["github", "google"]);
  return input.filter((provider) => valid.has(provider));
}
var PROJECT_NAME_RE = /^[a-z0-9-]+$/;
function validateProjectName(name) {
  if (!name) return "Project name is required";
  if (!PROJECT_NAME_RE.test(name)) return "Must be lowercase alphanumeric with hyphens";
}
function unwrap(value) {
  if (typeof value === "symbol") {
    throw new Error("Unexpected prompt cancellation");
  }
  return value;
}
async function gatherOptions(projectNameArg, flags = {}) {
  p.intro(pc.bgCyan(pc.black(" seedling ")));
  if (flags.yes) {
    const projectName = projectNameArg ?? "my-app";
    const nameError = validateProjectName(projectName);
    if (nameError) {
      p.log.error(nameError);
      process.exit(1);
    }
    p.log.info(`Using defaults for project "${projectName}"`);
    const socialProviders = flags.social && flags.social.length > 0 ? parseSocialProviders(flags.social) : ["github", "google"];
    return {
      projectName,
      displayName: toTitleCase(projectName),
      socialProviders,
      includeAdmin: flags.admin ?? true,
      includeR2: flags.r2 ?? false,
      includeTodos: flags.todos ?? true,
      includeCron: flags.cron ?? false,
      includeQueues: flags.queues ?? false,
      installDeps: flags.install ?? true,
      initGit: flags.git ?? true,
      setupCloudflare: flags.install ?? true ? flags.cloudflare ?? false : false
    };
  }
  const answers = await p.group(
    {
      projectName: () => p.text({
        message: "Project name",
        placeholder: projectNameArg ?? "my-app",
        defaultValue: projectNameArg ?? "my-app",
        validate: validateProjectName
      }),
      displayName: ({ results }) => {
        const name = toTitleCase(String(results.projectName ?? "my-app"));
        return p.text({
          message: "App display name",
          placeholder: name,
          defaultValue: name
        });
      },
      socialProviders: () => p.multiselect({
        message: "Social auth providers",
        options: [
          { value: "github", label: "GitHub" },
          { value: "google", label: "Google" }
        ],
        required: false
      }),
      includeAdmin: () => p.confirm({ message: "Include admin panel?", initialValue: true }),
      includeR2: () => p.confirm({ message: "Include R2 image storage?", initialValue: false }),
      includeTodos: () => p.confirm({ message: "Include example todos?", initialValue: true }),
      includeCron: () => p.confirm({ message: "Include cron trigger handlers?", initialValue: false }),
      includeQueues: () => p.confirm({ message: "Include queue handlers?", initialValue: false }),
      installDeps: () => p.confirm({ message: "Install dependencies with pnpm?", initialValue: true }),
      initGit: () => p.confirm({ message: "Initialize git repository?", initialValue: true }),
      setupCloudflare: ({ results }) => results.installDeps ? p.confirm({
        message: "Set up Cloudflare resources? (requires wrangler login)",
        initialValue: true
      }) : Promise.resolve(false)
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
    }
  );
  return {
    projectName: String(unwrap(answers.projectName)),
    displayName: String(unwrap(answers.displayName)),
    socialProviders: parseSocialProviders(
      unwrap(answers.socialProviders) ?? []
    ),
    includeAdmin: Boolean(unwrap(answers.includeAdmin)),
    includeR2: Boolean(unwrap(answers.includeR2)),
    includeTodos: Boolean(unwrap(answers.includeTodos)),
    includeCron: Boolean(unwrap(answers.includeCron)),
    includeQueues: Boolean(unwrap(answers.includeQueues)),
    installDeps: Boolean(unwrap(answers.installDeps)),
    initGit: Boolean(unwrap(answers.initGit)),
    setupCloudflare: Boolean(unwrap(answers.setupCloudflare))
  };
}

// src/scaffold.ts
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var TEMPLATE_DIR = path.resolve(__dirname, "..", "templates", "default");
var CONDITIONAL_PATHS = {
  includeAdmin: ["app/routes/admin", "app/services/auth/permissions.ts"],
  includeTodos: ["app/routes/todos.tsx", "drizzle/schema/todo.ts"],
  includeR2: ["app/routes/images.ts", "app/services/r2.server.ts"],
  includeCron: ["app/crons"],
  includeQueues: ["app/queues"]
};
var RENAME_MAP = {
  _gitignore: ".gitignore",
  "_dev.vars.example": ".dev.vars.example",
  "_oxfmtrc.json": ".oxfmtrc.json",
  "_oxlintrc.json": ".oxlintrc.json"
};
var TEXT_EXTENSIONS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".jsonc",
  ".css",
  ".html",
  ".md",
  ".yml",
  ".yaml",
  ".toml",
  ".sql",
  ".txt",
  ".cjs",
  ".mjs"
]);
async function scaffold(options) {
  const targetDir = path.resolve(process.cwd(), options.projectName);
  if (await fs.pathExists(targetDir)) {
    const entries = await fs.readdir(targetDir);
    if (entries.length > 0) {
      throw new Error(`Directory "${options.projectName}" already exists and is not empty`);
    }
  }
  await fs.copy(TEMPLATE_DIR, targetDir);
  for (const [feature, paths] of Object.entries(CONDITIONAL_PATHS)) {
    if (!options[feature]) {
      for (const p5 of paths) {
        await fs.remove(path.join(targetDir, p5));
      }
    }
  }
  for (const [from, to] of Object.entries(RENAME_MAP)) {
    const fromPath = path.join(targetDir, from);
    const toPath = path.join(targetDir, to);
    if (await fs.pathExists(fromPath)) {
      await fs.rename(fromPath, toPath);
    }
  }
  const context = buildContext(options);
  await processDirectory(targetDir, context);
  return targetDir;
}
function buildContext(options) {
  return {
    projectName: options.projectName,
    displayName: options.displayName,
    includeAdmin: options.includeAdmin,
    includeR2: options.includeR2,
    includeTodos: options.includeTodos,
    includeCron: options.includeCron,
    includeQueues: options.includeQueues,
    hasGithub: options.socialProviders.includes("github"),
    hasGoogle: options.socialProviders.includes("google"),
    hasSocialAuth: options.socialProviders.length > 0
  };
}
async function processDirectory(dir, context) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      await processDirectory(fullPath, context);
    } else if (isTextFile(entry.name)) {
      await processFile(fullPath, context);
    }
  }
}
function isTextFile(filename) {
  const ext = path.extname(filename);
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (filename.startsWith(".") || filename === "Dockerfile") return true;
  return false;
}
async function processFile(filePath, context) {
  let content = await fs.readFile(filePath, "utf-8");
  content = processConditionals(content, context, filePath);
  content = substituteVariables(content, context);
  if (filePath.endsWith(".json")) {
    content = cleanupJson(content);
  }
  await fs.writeFile(filePath, content, "utf-8");
}
function processConditionals(content, context, filePath) {
  const lines = content.split("\n");
  const result = processLines(lines, context, filePath);
  return result.join("\n");
}
function processLines(lines, context, filePath) {
  const result = [];
  let i = 0;
  while (i < lines.length) {
    const ifMatch = lines[i]?.match(/\{\{#if\s+(\w+)\}\}/);
    const unlessMatch = lines[i]?.match(/\{\{#unless\s+(\w+)\}\}/);
    if (ifMatch) {
      const feature = ifMatch[1];
      const block = collectBlock(lines, i, "if", filePath);
      i = block.endIndex + 1;
      if (context[feature]) {
        result.push(...processLines(block.content, context, filePath));
      }
    } else if (unlessMatch) {
      const feature = unlessMatch[1];
      const block = collectBlock(lines, i, "unless", filePath);
      i = block.endIndex + 1;
      if (!context[feature]) {
        result.push(...processLines(block.content, context, filePath));
      }
    } else {
      result.push(lines[i]);
      i++;
    }
  }
  return result;
}
function collectBlock(lines, startIndex, expectedTag, filePath) {
  const content = [];
  let depth = 1;
  let i = startIndex + 1;
  const location = filePath ? ` in ${filePath}` : "";
  while (i < lines.length && depth > 0) {
    if (lines[i]?.match(/\{\{#(?:if|unless)\s+\w+\}\}/)) {
      depth++;
    }
    const closeMatch = lines[i]?.match(/\{\{\/(if|unless)\}\}/);
    if (closeMatch) {
      depth--;
      if (depth === 0) {
        const closingTag = closeMatch[1];
        if (closingTag !== expectedTag) {
          throw new Error(
            `Mismatched template tag: opened with {{#${expectedTag}}} on line ${startIndex + 1} but closed with {{/${closingTag}}} on line ${i + 1}${location}`
          );
        }
        return { content, endIndex: i };
      }
    }
    content.push(lines[i]);
    i++;
  }
  throw new Error(
    `Unclosed {{#${expectedTag}}} block starting on line ${startIndex + 1}${location}`
  );
}
function substituteVariables(content, context) {
  return content.replace(/\{\{projectName\}\}/g, context.projectName).replace(/\{\{displayName\}\}/g, context.displayName);
}
function cleanupJson(content) {
  content = content.replace(/,(\s*[}\]])/g, "$1");
  content = content.replace(/\n{3,}/g, "\n\n");
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, "	") + "\n";
  } catch {
    return content;
  }
}

// src/post-scaffold.ts
import { randomBytes } from "crypto";
import { execSync as execSync2 } from "child_process";
import path3 from "path";
import * as p3 from "@clack/prompts";
import fs3 from "fs-extra";
import pc3 from "picocolors";

// src/cloudflare-setup.ts
import { execSync, spawnSync } from "child_process";
import path2 from "path";
import * as p2 from "@clack/prompts";
import fs2 from "fs-extra";
import pc2 from "picocolors";
var WRANGLER = "pnpm exec wrangler";
var EXEC_TIMEOUT_MS = 3e4;
async function setupCloudflare(options, targetDir) {
  p2.log.step(pc2.bold("Setting up Cloudflare resources..."));
  const authed = await ensureAuth(targetDir);
  if (!authed) {
    p2.log.warn("Skipping Cloudflare setup \u2014 you can configure wrangler.jsonc manually later.");
    return false;
  }
  const ids = await createResources(options, targetDir);
  await patchWranglerConfig(targetDir, ids);
  const hasCriticalIds = ids.d1DatabaseId !== null && ids.kvNamespaceId !== null;
  const migrated = await runLocalMigrations(targetDir);
  const seeded = await runLocalSeed(targetDir);
  if (hasCriticalIds && migrated && seeded) {
    p2.log.success("Cloudflare resources configured and local database seeded");
    return true;
  }
  p2.log.warn("Cloudflare setup completed with warnings \u2014 check the steps above.");
  return false;
}
async function ensureAuth(targetDir) {
  const whoami = tryExec(`${WRANGLER} whoami`, targetDir);
  if (whoami.success) {
    const account = parseAccountInfo(whoami.output);
    const displayAccount = account ?? "unknown account";
    const useAccount = await p2.confirm({
      message: `Logged in as ${pc2.cyan(displayAccount)}. Use this account?`,
      initialValue: true
    });
    if (p2.isCancel(useAccount)) {
      return false;
    }
    if (useAccount) {
      return true;
    }
    return runLogin(targetDir);
  }
  p2.log.info("Not currently logged in to Cloudflare.");
  const shouldLogin = await p2.confirm({
    message: "Log in with wrangler now?",
    initialValue: true
  });
  if (p2.isCancel(shouldLogin) || !shouldLogin) {
    return false;
  }
  return runLogin(targetDir);
}
function runLogin(targetDir) {
  try {
    execSync(`${WRANGLER} login`, {
      cwd: targetDir,
      stdio: "inherit"
    });
  } catch {
    p2.log.error("wrangler login failed.");
    return false;
  }
  const verify = tryExec(`${WRANGLER} whoami`, targetDir);
  if (!verify.success) {
    p2.log.error("Authentication could not be verified after login.");
    return false;
  }
  const account = parseAccountInfo(verify.output);
  if (account) {
    p2.log.success(`Authenticated as ${pc2.cyan(account)}`);
  }
  return true;
}
function parseAccountInfo(whoamiOutput) {
  const emailMatch = whoamiOutput.match(/associated with the email\s+(\S+)/i);
  if (emailMatch?.[1]) return emailMatch[1].replace(/\.?$/, "");
  const tableMatch = whoamiOutput.match(/│\s*([^│]+?)\s*│\s*[a-f0-9]{32}\s*│/);
  if (tableMatch?.[1]) return tableMatch[1].trim();
  return null;
}
function parseD1DatabaseId(output) {
  const jsonMatch = output.match(/"database_id"\s*:\s*"([^"]+)"/);
  if (jsonMatch?.[1]) return jsonMatch[1];
  const tomlMatch = output.match(/database_id\s*=\s*"([^"]+)"/);
  if (tomlMatch?.[1]) return tomlMatch[1];
  const uuidMatch = output.match(
    /Successfully created DB[\s\S]*?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  if (uuidMatch?.[1]) return uuidMatch[1];
  return null;
}
function parseKvNamespaceId(output) {
  const jsonMatch = output.match(/"id"\s*:\s*"([0-9a-f]{32})"/);
  if (jsonMatch?.[1]) return jsonMatch[1];
  const tomlMatch = output.match(/id\s*=\s*"([0-9a-f]{32})"/);
  if (tomlMatch?.[1]) return tomlMatch[1];
  return null;
}
function extractErrorMessage(output) {
  const clean = stripAnsi(output);
  const lines = clean.split("\n");
  const errorIdx = lines.findIndex((l) => /\[ERROR]/.test(l));
  if (errorIdx !== -1) {
    const headline = (lines[errorIdx] ?? "").replace(/.*\[ERROR]\s*/, "").trim();
    const details = [];
    for (let i = errorIdx + 1; i < lines.length; i++) {
      const trimmed = (lines[i] ?? "").trim();
      if (!trimmed) continue;
      if (/^(If you think this is a bug|https?:\/\/)/.test(trimmed)) break;
      details.push(trimmed);
    }
    if (details.length > 0) {
      return `${headline}
  ${details.join("\n  ")}`;
    }
    return headline;
  }
  const nonEmpty = lines.filter((l) => l.trim());
  return nonEmpty[0]?.trim() ?? "unknown error";
}
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}
async function createResources(options, targetDir) {
  const ids = {
    d1DatabaseId: null,
    kvNamespaceId: null
  };
  ids.d1DatabaseId = await createD1Database(options.projectName, targetDir);
  ids.kvNamespaceId = await createKvNamespace(options.projectName, targetDir);
  if (options.includeR2) {
    await createR2Bucket(options.projectName, targetDir);
  }
  if (options.includeQueues) {
    await createQueue(options.projectName, targetDir);
  }
  return ids;
}
async function createD1Database(projectName, targetDir) {
  const dbName = `${projectName}-db`;
  p2.log.step(`Creating D1 database "${dbName}"...`);
  const result = tryExec(`${WRANGLER} d1 create ${dbName}`, targetDir);
  if (result.success) {
    const id = parseD1DatabaseId(result.output);
    if (id) {
      p2.log.success(`D1 database created: ${pc2.dim(id)}`);
      return id;
    }
    p2.log.warn("D1 database created but could not parse database ID from output.");
  } else {
    const errLine = extractErrorMessage(result.output);
    p2.log.warn(`Failed to create D1 database: ${errLine}`);
  }
  return promptForId(`Enter D1 database ID for "${dbName}" (or leave blank to skip)`);
}
async function createKvNamespace(projectName, targetDir) {
  const kvName = `${projectName}-kv`;
  p2.log.step(`Creating KV namespace "${kvName}"...`);
  const result = tryExec(`${WRANGLER} kv namespace create ${kvName}`, targetDir);
  if (result.success) {
    const id = parseKvNamespaceId(result.output);
    if (id) {
      p2.log.success(`KV namespace created: ${pc2.dim(id)}`);
      return id;
    }
    p2.log.warn("KV namespace created but could not parse namespace ID from output.");
  } else {
    const errLine = extractErrorMessage(result.output);
    p2.log.warn(`Failed to create KV namespace: ${errLine}`);
  }
  return promptForId(`Enter KV namespace ID for "${kvName}" (or leave blank to skip)`);
}
async function createR2Bucket(projectName, targetDir) {
  const bucketName = `${projectName}-uploads`;
  p2.log.step(`Creating R2 bucket "${bucketName}"...`);
  const result = tryExec(`${WRANGLER} r2 bucket create ${bucketName}`, targetDir);
  if (result.success) {
    p2.log.success(`R2 bucket "${bucketName}" created`);
  } else {
    const errLine = extractErrorMessage(result.output);
    p2.log.warn(`Failed to create R2 bucket: ${errLine}`);
  }
}
async function createQueue(projectName, targetDir) {
  const queueName = `${projectName}-tasks`;
  p2.log.step(`Creating Queue "${queueName}"...`);
  const result = tryExec(`${WRANGLER} queues create ${queueName}`, targetDir);
  if (result.success) {
    p2.log.success(`Queue "${queueName}" created`);
  } else {
    const errLine = extractErrorMessage(result.output);
    p2.log.warn(`Failed to create Queue: ${errLine}`);
  }
}
async function promptForId(message) {
  const value = await p2.text({
    message,
    placeholder: "paste ID here, or press Enter to skip",
    defaultValue: ""
  });
  if (p2.isCancel(value) || !value) {
    return null;
  }
  return value;
}
async function patchWranglerConfig(targetDir, ids) {
  const configPath = path2.join(targetDir, "wrangler.jsonc");
  if (!await fs2.pathExists(configPath)) return;
  let content = await fs2.readFile(configPath, "utf-8");
  if (ids.d1DatabaseId) {
    content = content.replace("YOUR_D1_DATABASE_ID", ids.d1DatabaseId);
  }
  if (ids.kvNamespaceId) {
    content = content.replace("YOUR_KV_NAMESPACE_ID", ids.kvNamespaceId);
  }
  await fs2.writeFile(configPath, content, "utf-8");
  const patched = [];
  if (ids.d1DatabaseId) patched.push("D1 database ID");
  if (ids.kvNamespaceId) patched.push("KV namespace ID");
  if (patched.length > 0) {
    p2.log.success(`Updated wrangler.jsonc with ${patched.join(" and ")}`);
  }
}
async function runLocalMigrations(targetDir) {
  p2.log.step("Applying local D1 migrations...");
  try {
    execSync("pnpm db:migrate:local", {
      cwd: targetDir,
      stdio: "inherit"
    });
    p2.log.success("Local migrations applied");
    return true;
  } catch {
    p2.log.warn("Failed to apply migrations. Run `pnpm db:migrate:local` manually.");
    return false;
  }
}
async function runLocalSeed(targetDir) {
  p2.log.step("Seeding local database...");
  try {
    execSync(`${WRANGLER} d1 execute DB --local --file=drizzle/seed/seed.sql`, {
      cwd: targetDir,
      stdio: "inherit"
    });
    p2.log.success("Local database seeded");
    return true;
  } catch {
    p2.log.warn("Failed to seed database. Run `pnpm db:seed:local` manually.");
    return false;
  }
}
function tryExec(command, cwd) {
  const result = spawnSync(command, {
    cwd,
    encoding: "utf-8",
    shell: true,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: EXEC_TIMEOUT_MS
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  return {
    success: result.status === 0,
    stdout,
    stderr,
    output: `${stdout}
${stderr}`
  };
}

// src/post-scaffold.ts
async function postScaffold(options, targetDir) {
  await generateDevVars(targetDir);
  if (options.initGit) {
    p3.log.step("Initializing git repository...");
    try {
      execSync2("git init && git checkout -b main", {
        cwd: targetDir,
        stdio: "ignore"
      });
      p3.log.success("Git repository initialized");
    } catch {
      p3.log.warn("Failed to initialize git repository");
    }
  }
  if (options.installDeps) {
    p3.log.step("Installing dependencies with pnpm...");
    try {
      execSync2("pnpm install", {
        cwd: targetDir,
        stdio: "inherit"
      });
      p3.log.success("Dependencies installed");
    } catch {
      p3.log.warn("Failed to install dependencies. Run `pnpm install` manually.");
    }
  }
  let cloudflareReady = false;
  if (options.setupCloudflare) {
    cloudflareReady = await setupCloudflare(options, targetDir);
  }
  showNextSteps(options, cloudflareReady);
  p3.outro(pc3.green("Happy building!"));
}
function showNextSteps(options, cloudflareReady) {
  const steps = [];
  let step = 1;
  steps.push(`  ${pc3.cyan(`${step}.`)} cd ${options.projectName}`);
  step++;
  steps.push(`  ${pc3.cyan(`${step}.`)} Add your secrets to .dev.vars`);
  step++;
  if (!options.installDeps) {
    steps.push(`  ${pc3.cyan(`${step}.`)} pnpm install`);
    step++;
  }
  if (!cloudflareReady) {
    steps.push(`  ${pc3.cyan(`${step}.`)} Update wrangler.jsonc with your Cloudflare resource IDs`);
    step++;
    steps.push(`  ${pc3.cyan(`${step}.`)} pnpm db:migrate:local`);
    step++;
    steps.push(`  ${pc3.cyan(`${step}.`)} pnpm db:seed:local`);
    step++;
  }
  steps.push(`  ${pc3.cyan(`${step}.`)} pnpm dev`);
  p3.note([`${pc3.bold("Next steps:")}`, "", ...steps].join("\n"), "Your project is ready!");
}
async function generateDevVars(targetDir) {
  const examplePath = path3.join(targetDir, ".dev.vars.example");
  const devVarsPath = path3.join(targetDir, ".dev.vars");
  if (!await fs3.pathExists(examplePath)) return;
  let content = await fs3.readFile(examplePath, "utf-8");
  const secret = randomBytes(32).toString("base64");
  content = content.replace(/^BETTER_AUTH_SECRET=\s*$/m, `BETTER_AUTH_SECRET=${secret}`);
  await fs3.writeFile(devVarsPath, content, "utf-8");
  p3.log.success("Generated .dev.vars with BETTER_AUTH_SECRET");
}

// src/index.ts
var program = new Command();
program.name("seedling").description("Scaffold a full-stack Cloudflare Workers starter kit").version("0.1.0");
program.command("create").description("Create a new project").argument("[project-name]", "Name of the project directory").option("-y, --yes", "Skip prompts and use defaults").option("--admin", "Include admin panel (default with --yes)").option("--no-admin", "Exclude admin panel").option("--todos", "Include example todos (default with --yes)").option("--no-todos", "Exclude example todos").option("--r2", "Include R2 image storage").option("--cron", "Include cron trigger handlers").option("--queues", "Include queue handlers").option("--social <providers...>", "Social auth providers: github, google").option("--git", "Initialize git repository (default)").option("--no-git", "Skip git repository initialization").option("--install", "Install dependencies with pnpm (default)").option("--no-install", "Skip pnpm install").option("--cloudflare", "Set up Cloudflare resources").option("--no-cloudflare", "Skip Cloudflare resource setup").action(async (projectName, flags) => {
  try {
    const options = await gatherOptions(projectName, flags);
    const targetDir = await scaffold(options);
    await postScaffold(options, targetDir);
  } catch (err) {
    p4.log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
});
program.parse();
