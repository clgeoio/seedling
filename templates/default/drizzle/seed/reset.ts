import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema";

function resolveLocalD1DatabasePath(): string {
	const basePath = path.resolve(".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
	const files = fs.readdirSync(basePath);
	const dbFile = files.find((f) => f.endsWith(".sqlite"));
	if (!dbFile) {
		throw new Error(
			`No .sqlite file under ${basePath}. Run pnpm db:migrate:local once so local D1 exists.`,
		);
	}
	return path.join(basePath, dbFile);
}

async function main(): Promise<void> {
	const dbPath = resolveLocalD1DatabasePath();
	const sqlite = new Database(dbPath);
	const db = drizzle(sqlite, { schema });

	await db.delete(schema.accounts);
	await db.delete(schema.verifications);
	// {{#if includeTodos}}
	await db.delete(schema.todos);
	// {{/if}}
	await db.delete(schema.users);

	console.info("Local D1 tables cleared (all rows deleted).");
	sqlite.close();
}

main().catch((err: unknown) => {
	console.error(err);
	process.exitCode = 1;
});
