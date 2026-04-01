import { hashPassword } from "better-auth/crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
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

	const adminEmail = "admin@example.com";
	const existing = await db.query.users.findFirst({
		where: eq(schema.users.email, adminEmail),
	});
	if (existing) {
		console.info("Seed skipped: admin user already exists.");
		sqlite.close();
		return;
	}

	const now = new Date();
	const userId = crypto.randomUUID();
	const passwordHash = await hashPassword("admin123");

	await db.insert(schema.users).values({
		id: userId,
		name: adminEmail,
		email: adminEmail,
		emailVerified: true,
		image: null,
		role: "admin",
		banned: false,
		banReason: null,
		banExpires: null,
		createdAt: now,
		updatedAt: now,
	});

	await db.insert(schema.accounts).values({
		id: crypto.randomUUID(),
		accountId: userId,
		providerId: "credential",
		userId,
		accessToken: null,
		refreshToken: null,
		idToken: null,
		accessTokenExpiresAt: null,
		refreshTokenExpiresAt: null,
		scope: null,
		password: passwordHash,
		createdAt: now,
		updatedAt: now,
	});

	console.info(`Seeded admin user ${adminEmail} (password: admin123).`);
	sqlite.close();
}

main().catch((err: unknown) => {
	console.error(err);
	process.exitCode = 1;
});
