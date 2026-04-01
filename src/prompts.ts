import * as p from "@clack/prompts";
import pc from "picocolors";
import type { ProjectOptions } from "./types.js";

function toTitleCase(str: string): string {
	return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function gatherOptions(
	projectNameArg?: string,
	skipPrompts?: boolean,
): Promise<ProjectOptions> {
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
			initGit: true,
			setupCloudflare: false,
		};
	}

	const answers = await p.group(
		{
			projectName: () =>
				p.text({
					message: "Project name",
					placeholder: projectNameArg ?? "my-app",
					defaultValue: projectNameArg ?? "my-app",
					validate: (value) => {
						if (!value) return "Project name is required";
						if (!/^[a-z0-9-]+$/.test(value))
							return "Must be lowercase alphanumeric with hyphens";
					},
				}),
			displayName: ({ results }) =>
				p.text({
					message: "App display name",
					placeholder: toTitleCase(results.projectName as string),
					defaultValue: toTitleCase(results.projectName as string),
				}),
			socialProviders: () =>
				p.multiselect({
					message: "Social auth providers",
					options: [
						{ value: "github" as const, label: "GitHub" },
						{ value: "google" as const, label: "Google" },
					],
					required: false,
				}),
			includeAdmin: () => p.confirm({ message: "Include admin panel?", initialValue: true }),
			includeR2: () => p.confirm({ message: "Include R2 image storage?", initialValue: false }),
			includeTodos: () => p.confirm({ message: "Include example todos?", initialValue: true }),
			includeCron: () =>
				p.confirm({ message: "Include cron trigger handlers?", initialValue: false }),
			includeQueues: () =>
				p.confirm({ message: "Include queue handlers?", initialValue: false }),
		installDeps: () =>
			p.confirm({ message: "Install dependencies with pnpm?", initialValue: true }),
		initGit: () =>
			p.confirm({ message: "Initialize git repository?", initialValue: true }),
		setupCloudflare: ({ results }) =>
			results.installDeps
				? p.confirm({
						message: "Set up Cloudflare resources? (requires wrangler login)",
						initialValue: true,
					})
				: Promise.resolve(false),
	},
		{
			onCancel: () => {
				p.cancel("Operation cancelled.");
				process.exit(0);
			},
		},
	);

	return {
		projectName: answers.projectName as string,
		displayName: answers.displayName as string,
		socialProviders: (answers.socialProviders ?? []) as Array<"github" | "google">,
		includeAdmin: answers.includeAdmin as boolean,
		includeR2: answers.includeR2 as boolean,
		includeTodos: answers.includeTodos as boolean,
		includeCron: answers.includeCron as boolean,
		includeQueues: answers.includeQueues as boolean,
		installDeps: answers.installDeps as boolean,
		initGit: answers.initGit as boolean,
		setupCloudflare: answers.setupCloudflare as boolean,
	};
}
