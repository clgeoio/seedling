import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
// {{#if includeAdmin}}
import { admin } from "better-auth/plugins";
// {{/if}}
import { getDb } from "~/services/db.server";
import { sendEmail } from "~/services/email.server";

export function createAuth(env: Env) {
	const db = getDb(env);

	return betterAuth({
		database: drizzleAdapter(db, { provider: "sqlite", usePlural: true }),
		baseURL: env.APP_URL,
		secret: env.BETTER_AUTH_SECRET,

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				await sendEmail(env, {
					to: user.email,
					subject: "Reset your password",
					html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
				});
			},
		},

		emailVerification: {
			sendVerificationEmail: async ({ user, url }) => {
				await sendEmail(env, {
					to: user.email,
					subject: "Verify your email",
					html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
				});
			},
			sendOnSignUp: true,
		},

// {{#if hasSocialAuth}}
		socialProviders: {
// {{#if hasGithub}}
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			},
// {{/if}}
// {{#if hasGoogle}}
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
// {{/if}}
		},
// {{/if}}

		account: {
			accountLinking: {
				enabled: true,
			},
		},

		plugins: [
// {{#if includeAdmin}}
			admin({
				adminUserIds: env.BETTER_AUTH_ADMIN_USER_ID
					? [env.BETTER_AUTH_ADMIN_USER_ID]
					: [],
			}),
// {{/if}}
		],

		secondaryStorage: {
			get: async (key: string) => {
				const value = await env.APP_KV.get(`auth:${key}`);
				return value ?? null;
			},
			set: async (key: string, value: string, ttl?: number) => {
				const kvTtl = ttl ? Math.max(ttl, 60) : undefined;
				await env.APP_KV.put(`auth:${key}`, value, kvTtl ? { expirationTtl: kvTtl } : undefined);
			},
			delete: async (key: string) => {
				await env.APP_KV.delete(`auth:${key}`);
			},
		},

		rateLimit: {
			enabled: true,
			window: 60,
			max: 10,
		},

// {{#if includeR2}}
		user: {
			deleteUser: {
				enabled: true,
				beforeDelete: async (user) => {
					if (user.image) {
						try {
							const key = new URL(user.image).pathname.slice(1);
							await env.R2.delete(key);
						} catch {
							// best-effort
						}
					}
				},
			},
		},
// {{/if}}
// {{#unless includeR2}}
		user: {
			deleteUser: {
				enabled: true,
			},
		},
// {{/unless}}
	});
}

export type Auth = ReturnType<typeof createAuth>;
