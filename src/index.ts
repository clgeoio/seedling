import { Command } from "commander";
import { gatherOptions } from "./prompts.js";
import { scaffold } from "./scaffold.js";
import { postScaffold } from "./post-scaffold.js";

const program = new Command();

program
	.name("seedling")
	.description("Scaffold a full-stack Cloudflare Workers starter kit")
	.version("0.1.0");

program
	.command("create")
	.description("Create a new project")
	.argument("[project-name]", "Name of the project directory")
	.option("-y, --yes", "Skip prompts and use defaults")
	.action(async (projectName?: string, cmdOptions?: { yes?: boolean }) => {
		const options = await gatherOptions(projectName, cmdOptions?.yes);
		const targetDir = await scaffold(options);
		await postScaffold(options, targetDir);
	});

program.parse();
