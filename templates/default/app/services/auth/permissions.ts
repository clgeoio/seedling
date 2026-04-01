import { createAccessControl } from "better-auth/plugins/access";

const statements = {
	user: ["create", "read", "update", "delete"],
	dashboard: ["read"],
} as const;

export const ac = createAccessControl(statements);

export const adminRole = ac.newRole({
	user: ["create", "read", "update", "delete"],
	dashboard: ["read"],
});

export const editorRole = ac.newRole({
	dashboard: ["read"],
});
