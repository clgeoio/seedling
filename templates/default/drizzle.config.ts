import { defineConfig } from "drizzle-kit";
import fs from "node:fs";
import path from "node:path";

function getLocalD1DB(): string {
	const basePath = path.resolve(".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
	try {
		const files = fs.readdirSync(basePath);
		const dbFile = files.find((f) => f.endsWith(".sqlite"));
		if (dbFile) return path.join(basePath, dbFile);
	} catch {
		// Directory doesn't exist yet
	}
	return path.join(basePath, "placeholder.sqlite");
}

export default defineConfig({
	dialect: "sqlite",
	schema: "./drizzle/schema/index.ts",
	out: "./drizzle/migrations",
	dbCredentials: {
		url: getLocalD1DB(),
	},
});
