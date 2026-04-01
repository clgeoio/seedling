import { randomBytes } from "node:crypto";
import { execSync } from "node:child_process";
import path from "node:path";
import * as p from "@clack/prompts";
import fs from "fs-extra";
import pc from "picocolors";
import type { ProjectOptions } from "./types.js";

export async function postScaffold(options: ProjectOptions, targetDir: string): Promise<void> {
	await generateDevVars(targetDir);

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
			`  ${pc.cyan("2.")} Add your secrets to .dev.vars`,
			`  ${pc.cyan("3.")} Update wrangler.jsonc with your Cloudflare resource IDs`,
			`  ${pc.cyan("4.")} pnpm db:migrate:local`,
			`  ${pc.cyan("5.")} pnpm db:seed:local`,
			`  ${pc.cyan("6.")} pnpm dev`,
		].join("\n"),
		"Your project is ready!",
	);

	p.outro(pc.green("Happy building!"));
}

async function generateDevVars(targetDir: string): Promise<void> {
	const examplePath = path.join(targetDir, ".dev.vars.example");
	const devVarsPath = path.join(targetDir, ".dev.vars");

	if (!(await fs.pathExists(examplePath))) return;

	let content = await fs.readFile(examplePath, "utf-8");
	const secret = randomBytes(32).toString("base64");
	content = content.replace(/^BETTER_AUTH_SECRET=$/m, `BETTER_AUTH_SECRET=${secret}`);

	await fs.writeFile(devVarsPath, content, "utf-8");
	p.log.success("Generated .dev.vars with BETTER_AUTH_SECRET");
}
