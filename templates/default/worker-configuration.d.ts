interface Env {
	DB: D1Database;
	APP_KV: KVNamespace;
// {{#if includeR2}}
	R2: R2Bucket;
// {{/if}}
// {{#if includeQueues}}
	TASK_QUEUE: Queue;
// {{/if}}
	APP_URL: string;
	APP_ENV: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_ADMIN_USER_ID: string;
	RESEND_API_KEY: string;
// {{#if hasGithub}}
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
// {{/if}}
// {{#if hasGoogle}}
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
// {{/if}}
}

declare module "cloudflare:workers" {
	const env: Env;
	export { env };
}
