import { Command } from "commander";
import { gatherOptions } from "./prompts.js";
import { scaffold } from "./scaffold.js";
import { postScaffold } from "./post-scaffold.js";
import type { CliFlags } from "./types.js";

declare const __VERSION__: string;

const program = new Command();

program
	.name("seedling")
	.description("Scaffold a full-stack Cloudflare Workers starter kit")
	.version(__VERSION__);

program
	.command("create")
	.description("Create a new project")
	.argument("[project-name]", "Name of the project directory")
	.option("-y, --yes", "Skip prompts and use defaults")
	.option("--admin", "Include admin panel (default with --yes)")
	.option("--no-admin", "Exclude admin panel")
	.option("--todos", "Include example todos (default with --yes)")
	.option("--no-todos", "Exclude example todos")
	.option("--r2", "Include R2 image storage")
	.option("--cron", "Include cron trigger handlers")
	.option("--queues", "Include queue handlers")
	.option("--social <providers...>", "Social auth providers: github, google")
	.option("--no-git", "Skip git repository initialization")
	.option("--no-install", "Skip pnpm install")
	.option("--no-cloudflare", "Skip Cloudflare resource setup")
	.action(async (projectName: string | undefined, flags: CliFlags) => {
		const options = await gatherOptions(projectName, flags);
		const targetDir = await scaffold(options);
		await postScaffold(options, targetDir);
	});

program.parse();
