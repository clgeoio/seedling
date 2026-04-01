import { randomBytes } from "node:crypto";
import { execSync } from "node:child_process";
import path from "node:path";
import * as p from "@clack/prompts";
import fs from "fs-extra";
import pc from "picocolors";
import type { ProjectOptions } from "./types.js";

export async function postScaffold(options: ProjectOptions, targetDir: string): Promise<void> {
	await generateEnvFile(targetDir);

	if (options.initGit) {
		p.log.step("Initializing git repository...");
		try {
			execSync("git init && git checkout -b main", {
				cwd: targetDir,
				stdio: "ignore",
			});
			p.log.success("Git repository initialized");
		} catch {
			p.log.warn("Failed to initialize git repository");
		}
	}

	if (options.installDeps) {
		p.log.step("Installing dependencies with pnpm...");
		try {
			execSync("pnpm install", {
				cwd: targetDir,
				stdio: "inherit",
			});
			p.log.success("Dependencies installed");
		} catch {
			p.log.warn("Failed to install dependencies. Run `pnpm install` manually.");
		}
	}

	p.note(
		[
			`${pc.bold("Next steps:")}`,
			"",
			`  ${pc.cyan("1.")} cd ${options.projectName}`,
			`  ${pc.cyan("2.")} Update .env and wrangler.jsonc with your secrets`,
			`  ${pc.cyan("3.")} pnpm db:migrate:local`,
			`  ${pc.cyan("4.")} pnpm db:seed:local`,
			`  ${pc.cyan("5.")} pnpm dev`,
		].join("\n"),
		"Your project is ready!",
	);

	p.outro(pc.green("Happy building!"));
}

async function generateEnvFile(targetDir: string): Promise<void> {
	const envExamplePath = path.join(targetDir, ".env.example");
	const envPath = path.join(targetDir, ".env");

	if (!(await fs.pathExists(envExamplePath))) return;

	let content = await fs.readFile(envExamplePath, "utf-8");
	const secret = randomBytes(32).toString("base64");
	content = content.replace(/^BETTER_AUTH_SECRET=$/m, `BETTER_AUTH_SECRET=${secret}`);

	await fs.writeFile(envPath, content, "utf-8");
	p.log.success("Generated .env with BETTER_AUTH_SECRET");
}
