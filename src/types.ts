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
}

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
