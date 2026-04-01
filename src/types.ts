/** All resolved options for a project being scaffolded. */
export interface ProjectOptions {
	projectName: string;
	displayName: string;
	socialProviders: Array<"github" | "google">;
	includeAdmin: boolean;
	includeR2: boolean;
	includeTodos: boolean;
	includeCron: boolean;
	includeQueues: boolean;
	installDeps: boolean;
	initGit: boolean;
	setupCloudflare: boolean;
}

/** Variables available to the template engine for conditionals and substitution. */
export interface TemplateContext {
	projectName: string;
	displayName: string;
	includeAdmin: boolean;
	includeR2: boolean;
	includeTodos: boolean;
	includeCron: boolean;
	includeQueues: boolean;
	hasGithub: boolean;
	hasGoogle: boolean;
	hasSocialAuth: boolean;
}

/**
 * CLI flags parsed by Commander from `seedling create` arguments.
 * When `yes` is true, defaults are used with individual flags as overrides.
 * `undefined` means the flag was not explicitly set.
 */
export interface CliFlags {
	yes?: boolean;
	admin?: boolean;
	todos?: boolean;
	r2?: boolean;
	cron?: boolean;
	queues?: boolean;
	social?: string[];
	git?: boolean;
	install?: boolean;
	cloudflare?: boolean;
}
