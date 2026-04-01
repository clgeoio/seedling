import { lt } from "drizzle-orm";
import * as schema from "~/drizzle/schema";
import { getDb } from "~/services/db.server";

/**
 * Delete expired rows from the `verifications` table (email verification, password reset tokens, etc.).
 * If you use `secondaryStorage` without `verification.storeInDatabase`, Better Auth keeps tokens in KV
 * instead; this job is still safe and becomes a no-op on an empty table.
 */
export async function cleanupVerifications(env: Env): Promise<void> {
	const db = getDb(env);
	await db.delete(schema.verifications).where(lt(schema.verifications.expiresAt, new Date()));
}
