import { execSync } from "node:child_process";
import * as p from "@clack/prompts";
import pc from "picocolors";
import type { ProjectOptions } from "./types.js";

export async function postScaffold(options: ProjectOptions, targetDir: string): Promise<void> {
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
			`  ${pc.cyan("2.")} cp .env.example .env`,
			`  ${pc.cyan("3.")} cp wrangler.jsonc.example wrangler.jsonc`,
			`  ${pc.cyan("4.")} Update .env with your secrets`,
			`  ${pc.cyan("5.")} pnpm db:migrate:local`,
			`  ${pc.cyan("6.")} pnpm db:seed:local`,
			`  ${pc.cyan("7.")} pnpm dev`,
		].join("\n"),
		"Your project is ready!",
	);

	p.outro(pc.green("Happy building!"));
}
