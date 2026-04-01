import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statements = {
	...defaultStatements,
	dashboard: ["read"],
} as const;

export const ac = createAccessControl(statements);

export const adminRole = ac.newRole({
	...adminAc.statements,
	dashboard: ["read"],
});

export const editorRole = ac.newRole({
	dashboard: ["read"],
});
