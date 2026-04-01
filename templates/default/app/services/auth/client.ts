import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
// {{#if includeAdmin}}
import { adminClient } from "better-auth/client/plugins";
// {{/if}}

export const authClient = createAuthClient({
	plugins: [
		usernameClient(),
// {{#if includeAdmin}}
		adminClient(),
// {{/if}}
	],
});

export const { signIn, signUp, signOut, useSession, getSession, resetPassword } = authClient;
