#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";

// src/prompts.ts
import * as p from "@clack/prompts";
import pc from "picocolors";
function toTitleCase(str) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
async function gatherOptions(projectNameArg, skipPrompts) {
  p.intro(pc.bgCyan(pc.black(" seedling ")));
  if (skipPrompts) {
    const projectName = projectNameArg ?? "my-app";
    p.log.info(`Using defaults for project "${projectName}"`);
    return {
      projectName,
      displayName: toTitleCase(projectName),
      socialProviders: ["github", "google"],
      includeAdmin: true,
      includeR2: false,
      includeTodos: true,
      includeCron: false,
      includeQueues: false,
      installDeps: true,
      initGit: true
    };
  }
  const answers = await p.group(
    {
      projectName: () => p.text({
        message: "Project name",
        placeholder: projectNameArg ?? "my-app",
        defaultValue: projectNameArg ?? "my-app",
        validate: (value) => {
          if (!value) return "Project name is required";
          if (!/^[a-z0-9-]+$/.test(value))
            return "Must be lowercase alphanumeric with hyphens";
        }
      }),
      displayName: ({ results }) => p.text({
        message: "App display name",
        placeholder: toTitleCase(results.projectName),
        defaultValue: toTitleCase(results.projectName)
      }),
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
      initGit: () => p.confirm({ message: "Initialize git repository?", initialValue: true })
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
    }
  );
  return {
    projectName: answers.projectName,
    displayName: answers.displayName,
    socialProviders: answers.socialProviders ?? [],
    includeAdmin: answers.includeAdmin,
    includeR2: answers.includeR2,
    includeTodos: answers.includeTodos,
    includeCron: answers.includeCron,
    includeQueues: answers.includeQueues,
    installDeps: answers.installDeps,
    initGit: answers.initGit
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
  "_editorconfig": ".editorconfig",
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
      for (const p3 of paths) {
        await fs.remove(path.join(targetDir, p3));
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
  content = processConditionals(content, context);
  content = substituteVariables(content, context);
  if (filePath.endsWith(".json")) {
    content = cleanupJson(content);
  }
  await fs.writeFile(filePath, content, "utf-8");
}
function processConditionals(content, context) {
  const lines = content.split("\n");
  const result = processLines(lines, context);
  return result.join("\n");
}
function processLines(lines, context) {
  const result = [];
  let i = 0;
  while (i < lines.length) {
    const ifMatch = lines[i]?.match(/\{\{#if\s+(\w+)\}\}/);
    const unlessMatch = lines[i]?.match(/\{\{#unless\s+(\w+)\}\}/);
    if (ifMatch) {
      const feature = ifMatch[1];
      const block = collectBlock(lines, i);
      i = block.endIndex + 1;
      if (context[feature]) {
        result.push(...processLines(block.content, context));
      }
    } else if (unlessMatch) {
      const feature = unlessMatch[1];
      const block = collectBlock(lines, i);
      i = block.endIndex + 1;
      if (!context[feature]) {
        result.push(...processLines(block.content, context));
      }
    } else {
      result.push(lines[i]);
      i++;
    }
  }
  return result;
}
function collectBlock(lines, startIndex) {
  const content = [];
  let depth = 1;
  let i = startIndex + 1;
  while (i < lines.length && depth > 0) {
    if (lines[i]?.match(/\{\{#(?:if|unless)\s+\w+\}\}/)) {
      depth++;
    }
    if (lines[i]?.match(/\{\{\/(?:if|unless)\}\}/)) {
      depth--;
      if (depth === 0) {
        return { content, endIndex: i };
      }
    }
    content.push(lines[i]);
    i++;
  }
  return { content, endIndex: i - 1 };
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
import { execSync } from "child_process";
import path2 from "path";
import * as p2 from "@clack/prompts";
import fs2 from "fs-extra";
import pc2 from "picocolors";
async function postScaffold(options, targetDir) {
  await generateDevVars(targetDir);
  if (options.initGit) {
    p2.log.step("Initializing git repository...");
    try {
      execSync("git init && git checkout -b main", {
        cwd: targetDir,
        stdio: "ignore"
      });
      p2.log.success("Git repository initialized");
    } catch {
      p2.log.warn("Failed to initialize git repository");
    }
  }
  if (options.installDeps) {
    p2.log.step("Installing dependencies with pnpm...");
    try {
      execSync("pnpm install", {
        cwd: targetDir,
        stdio: "inherit"
      });
      p2.log.success("Dependencies installed");
    } catch {
      p2.log.warn("Failed to install dependencies. Run `pnpm install` manually.");
    }
  }
  p2.note(
    [
      `${pc2.bold("Next steps:")}`,
      "",
      `  ${pc2.cyan("1.")} cd ${options.projectName}`,
      `  ${pc2.cyan("2.")} Add your secrets to .dev.vars`,
      `  ${pc2.cyan("3.")} Update wrangler.jsonc with your Cloudflare resource IDs`,
      `  ${pc2.cyan("4.")} pnpm db:migrate:local`,
      `  ${pc2.cyan("5.")} pnpm db:seed:local`,
      `  ${pc2.cyan("6.")} pnpm dev`
    ].join("\n"),
    "Your project is ready!"
  );
  p2.outro(pc2.green("Happy building!"));
}
async function generateDevVars(targetDir) {
  const examplePath = path2.join(targetDir, ".dev.vars.example");
  const devVarsPath = path2.join(targetDir, ".dev.vars");
  if (!await fs2.pathExists(examplePath)) return;
  let content = await fs2.readFile(examplePath, "utf-8");
  const secret = randomBytes(32).toString("base64");
  content = content.replace(/^BETTER_AUTH_SECRET=$/m, `BETTER_AUTH_SECRET=${secret}`);
  await fs2.writeFile(devVarsPath, content, "utf-8");
  p2.log.success("Generated .dev.vars with BETTER_AUTH_SECRET");
}

// src/index.ts
var program = new Command();
program.name("seedling").description("Scaffold a full-stack Cloudflare Workers starter kit").version("0.1.0");
program.command("create").description("Create a new project").argument("[project-name]", "Name of the project directory").option("-y, --yes", "Skip prompts and use defaults").action(async (projectName, cmdOptions) => {
  const options = await gatherOptions(projectName, cmdOptions?.yes);
  const targetDir = await scaffold(options);
  await postScaffold(options, targetDir);
});
program.parse();
