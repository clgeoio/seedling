import { randomBytes } from "node:crypto";
import { execSync } from "node:child_process";
import path from "node:path";
import * as p from "@clack/prompts";
import fs from "fs-extra";
import pc from "picocolors";
import { setupCloudflare } from "./cloudflare-setup.js";
import type { ProjectOptions } from "./types.js";

/**
 * Runs post-scaffold steps: generates `.dev.vars` with a random auth secret,
 * optionally initializes git, installs dependencies, and provisions Cloudflare resources.
 */
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

	let cloudflareReady = false;
	if (options.setupCloudflare) {
		cloudflareReady = await setupCloudflare(options, targetDir);
	}

	showNextSteps(options, cloudflareReady);

	p.outro(pc.green("Happy building!"));
}

function showNextSteps(options: ProjectOptions, cloudflareReady: boolean): void {
	const steps: string[] = [];
	let step = 1;

	steps.push(`  ${pc.cyan(`${step}.`)} cd ${options.projectName}`);
	step++;

	steps.push(`  ${pc.cyan(`${step}.`)} Add your secrets to .dev.vars`);
	step++;

	if (!cloudflareReady) {
		steps.push(`  ${pc.cyan(`${step}.`)} Update wrangler.jsonc with your Cloudflare resource IDs`);
		step++;

		steps.push(`  ${pc.cyan(`${step}.`)} pnpm db:migrate:local`);
		step++;

		steps.push(`  ${pc.cyan(`${step}.`)} pnpm db:seed:local`);
		step++;
	}

	steps.push(`  ${pc.cyan(`${step}.`)} pnpm dev`);

	p.note([`${pc.bold("Next steps:")}`, "", ...steps].join("\n"), "Your project is ready!");
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
