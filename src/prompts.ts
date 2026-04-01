import * as p from "@clack/prompts";
import pc from "picocolors";
import type { CliFlags, ProjectOptions } from "./types.js";

function toTitleCase(str: string): string {
	return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseSocialProviders(input: string[]): Array<"github" | "google"> {
	const valid = new Set<string>(["github", "google"]);
	return input.filter((provider): provider is "github" | "google" => valid.has(provider));
}

const PROJECT_NAME_RE = /^[a-z0-9-]+$/;

function validateProjectName(name: string | undefined): string | undefined {
	if (!name) return "Project name is required";
	if (!PROJECT_NAME_RE.test(name)) return "Must be lowercase alphanumeric with hyphens";
}

function unwrap<T>(value: T | symbol): T {
	if (typeof value === "symbol") {
		throw new Error("Unexpected prompt cancellation");
	}
	return value;
}

/**
 * Gathers all project options either from CLI flags (when `--yes` is set)
 * or by walking the user through interactive prompts.
 *
 * With `--yes`, defaults are applied and individual flags override them.
 * Without `--yes`, all prompts are shown interactively.
 */
export async function gatherOptions(
	projectNameArg?: string,
	flags: CliFlags = {},
): Promise<ProjectOptions> {
	p.intro(pc.bgCyan(pc.black(" seedling ")));

	if (flags.yes) {
		const projectName = projectNameArg ?? "my-app";
		const nameError = validateProjectName(projectName);
		if (nameError) {
			p.log.error(nameError);
			process.exit(1);
		}
		p.log.info(`Using defaults for project "${projectName}"`);
		return {
			projectName,
			displayName: toTitleCase(projectName),
			socialProviders: flags.social ? parseSocialProviders(flags.social) : ["github", "google"],
			includeAdmin: flags.admin ?? true,
			includeR2: flags.r2 ?? false,
			includeTodos: flags.todos ?? true,
			includeCron: flags.cron ?? false,
			includeQueues: flags.queues ?? false,
			installDeps: flags.install ?? true,
			initGit: flags.git ?? true,
			setupCloudflare: flags.cloudflare ?? false,
		};
	}

	const answers = await p.group(
		{
			projectName: () =>
				p.text({
					message: "Project name",
					placeholder: projectNameArg ?? "my-app",
					defaultValue: projectNameArg ?? "my-app",
					validate: validateProjectName,
				}),
			displayName: ({ results }) => {
				const name = toTitleCase(String(results.projectName ?? "my-app"));
				return p.text({
					message: "App display name",
					placeholder: name,
					defaultValue: name,
				});
			},
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
			includeQueues: () => p.confirm({ message: "Include queue handlers?", initialValue: false }),
			installDeps: () =>
				p.confirm({ message: "Install dependencies with pnpm?", initialValue: true }),
			initGit: () => p.confirm({ message: "Initialize git repository?", initialValue: true }),
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
		projectName: String(unwrap(answers.projectName)),
		displayName: String(unwrap(answers.displayName)),
		socialProviders: parseSocialProviders(
			(unwrap(answers.socialProviders) as string[] | undefined) ?? [],
		),
		includeAdmin: Boolean(unwrap(answers.includeAdmin)),
		includeR2: Boolean(unwrap(answers.includeR2)),
		includeTodos: Boolean(unwrap(answers.includeTodos)),
		includeCron: Boolean(unwrap(answers.includeCron)),
		includeQueues: Boolean(unwrap(answers.includeQueues)),
		installDeps: Boolean(unwrap(answers.installDeps)),
		initGit: Boolean(unwrap(answers.initGit)),
		setupCloudflare: Boolean(unwrap(answers.setupCloudflare)),
	};
}
