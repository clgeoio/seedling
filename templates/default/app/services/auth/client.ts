import { createAuthClient } from "better-auth/react";
// {{#if includeAdmin}}
import { adminClient } from "better-auth/client/plugins";
// {{/if}}

export const authClient = createAuthClient({
// {{#if includeAdmin}}
	plugins: [
		adminClient(),
	],
// {{/if}}
});

export const { signIn, signUp, signOut, useSession, getSession, resetPassword } = authClient;
