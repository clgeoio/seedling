import { execSync } from "node:child_process";
import path from "node:path";
import * as p from "@clack/prompts";
import fs from "fs-extra";
import pc from "picocolors";
import type { ProjectOptions } from "./types.js";

const WRANGLER = "pnpm exec wrangler";

interface ResourceIds {
	d1DatabaseId: string | null;
	kvNamespaceId: string | null;
}

export async function setupCloudflare(options: ProjectOptions, targetDir: string): Promise<boolean> {
	p.log.step(pc.bold("Setting up Cloudflare resources..."));

	const authed = await ensureAuth(targetDir);
	if (!authed) {
		p.log.warn("Skipping Cloudflare setup — you can configure wrangler.jsonc manually later.");
		return false;
	}

	const ids = await createResources(options, targetDir);
	await patchWranglerConfig(targetDir, ids);

	await runLocalMigrations(targetDir);
	await runLocalSeed(targetDir);

	p.log.success("Cloudflare resources configured and local database seeded");
	return true;
}

async function ensureAuth(targetDir: string): Promise<boolean> {
	const whoami = tryExec(`${WRANGLER} whoami`, targetDir);

	if (whoami.success) {
		const account = parseAccountName(whoami.stdout);
		const displayAccount = account ?? "unknown account";

		const useAccount = await p.confirm({
			message: `Logged in as ${pc.cyan(displayAccount)}. Use this account?`,
			initialValue: true,
		});

		if (p.isCancel(useAccount)) {
			return false;
		}

		if (useAccount) {
			return true;
		}

		return runLogin(targetDir);
	}

	p.log.info("Not currently logged in to Cloudflare.");

	const shouldLogin = await p.confirm({
		message: "Log in with wrangler now?",
		initialValue: true,
	});

	if (p.isCancel(shouldLogin) || !shouldLogin) {
		return false;
	}

	return runLogin(targetDir);
}

function runLogin(targetDir: string): boolean {
	try {
		execSync(`${WRANGLER} login`, {
			cwd: targetDir,
			stdio: "inherit",
		});
	} catch {
		p.log.error("wrangler login failed.");
		return false;
	}

	const verify = tryExec(`${WRANGLER} whoami`, targetDir);
	if (!verify.success) {
		p.log.error("Authentication could not be verified after login.");
		return false;
	}

	const account = parseAccountName(verify.stdout);
	if (account) {
		p.log.success(`Authenticated as ${pc.cyan(account)}`);
	}
	return true;
}

function parseAccountName(whoamiOutput: string): string | null {
	const match = whoamiOutput.match(/──\s+(.+?)\s+──/);
	if (match?.[1]) return match[1].trim();

	const accountMatch = whoamiOutput.match(/Account Name:\s*(.+)/i);
	if (accountMatch?.[1]) return accountMatch[1].trim();

	return null;
}

async function createResources(options: ProjectOptions, targetDir: string): Promise<ResourceIds> {
	const ids: ResourceIds = {
		d1DatabaseId: null,
		kvNamespaceId: null,
	};

	ids.d1DatabaseId = await createD1Database(options.projectName, targetDir);
	ids.kvNamespaceId = await createKvNamespace(targetDir);

	if (options.includeR2) {
		await createR2Bucket(options.projectName, targetDir);
	}

	if (options.includeQueues) {
		await createQueue(options.projectName, targetDir);
	}

	return ids;
}

async function createD1Database(projectName: string, targetDir: string): Promise<string | null> {
	const dbName = `${projectName}-db`;
	p.log.step(`Creating D1 database "${dbName}"...`);

	const result = tryExec(`${WRANGLER} d1 create ${dbName}`, targetDir);
	if (result.success) {
		const id = result.stdout.match(/database_id\s*=\s*"([^"]+)"/)?.[1] ?? null;
		if (id) {
			p.log.success(`D1 database created: ${pc.dim(id)}`);
			return id;
		}
		p.log.warn("D1 database created but could not parse database ID from output.");
	} else {
		p.log.warn(`Failed to create D1 database: ${result.stderr.split("\n")[0]}`);
	}

	return promptForId(`Enter D1 database ID for "${dbName}" (or leave blank to skip)`);
}

async function createKvNamespace(targetDir: string): Promise<string | null> {
	p.log.step("Creating KV namespace \"APP_KV\"...");

	const result = tryExec(`${WRANGLER} kv namespace create APP_KV`, targetDir);
	if (result.success) {
		const id = result.stdout.match(/id\s*=\s*"([^"]+)"/)?.[1] ?? null;
		if (id) {
			p.log.success(`KV namespace created: ${pc.dim(id)}`);
			return id;
		}
		p.log.warn("KV namespace created but could not parse namespace ID from output.");
	} else {
		p.log.warn(`Failed to create KV namespace: ${result.stderr.split("\n")[0]}`);
	}

	return promptForId("Enter KV namespace ID for \"APP_KV\" (or leave blank to skip)");
}

async function createR2Bucket(projectName: string, targetDir: string): Promise<void> {
	const bucketName = `${projectName}-uploads`;
	p.log.step(`Creating R2 bucket "${bucketName}"...`);

	const result = tryExec(`${WRANGLER} r2 bucket create ${bucketName}`, targetDir);
	if (result.success) {
		p.log.success(`R2 bucket "${bucketName}" created`);
	} else {
		p.log.warn(`Failed to create R2 bucket: ${result.stderr.split("\n")[0]}`);
	}
}

async function createQueue(projectName: string, targetDir: string): Promise<void> {
	const queueName = `${projectName}-tasks`;
	p.log.step(`Creating Queue "${queueName}"...`);

	const result = tryExec(`${WRANGLER} queues create ${queueName}`, targetDir);
	if (result.success) {
		p.log.success(`Queue "${queueName}" created`);
	} else {
		p.log.warn(`Failed to create Queue: ${result.stderr.split("\n")[0]}`);
	}
}

async function promptForId(message: string): Promise<string | null> {
	const value = await p.text({
		message,
		placeholder: "paste ID here, or press Enter to skip",
		defaultValue: "",
	});

	if (p.isCancel(value) || !value) {
		return null;
	}

	return value;
}

async function patchWranglerConfig(targetDir: string, ids: ResourceIds): Promise<void> {
	const configPath = path.join(targetDir, "wrangler.jsonc");
	if (!(await fs.pathExists(configPath))) return;

	let content = await fs.readFile(configPath, "utf-8");

	if (ids.d1DatabaseId) {
		content = content.replace("YOUR_D1_DATABASE_ID", ids.d1DatabaseId);
	}

	if (ids.kvNamespaceId) {
		content = content.replace("YOUR_KV_NAMESPACE_ID", ids.kvNamespaceId);
	}

	await fs.writeFile(configPath, content, "utf-8");

	const patched: string[] = [];
	if (ids.d1DatabaseId) patched.push("D1 database ID");
	if (ids.kvNamespaceId) patched.push("KV namespace ID");

	if (patched.length > 0) {
		p.log.success(`Updated wrangler.jsonc with ${patched.join(" and ")}`);
	}
}

async function runLocalMigrations(targetDir: string): Promise<void> {
	p.log.step("Applying local D1 migrations...");
	try {
		execSync("pnpm db:migrate:local", {
			cwd: targetDir,
			stdio: "inherit",
		});
		p.log.success("Local migrations applied");
	} catch {
		p.log.warn("Failed to apply migrations. Run `pnpm db:migrate:local` manually.");
	}
}

async function runLocalSeed(targetDir: string): Promise<void> {
	p.log.step("Seeding local database...");
	try {
		execSync("pnpm db:seed:local", {
			cwd: targetDir,
			stdio: "inherit",
		});
		p.log.success("Local database seeded");
	} catch {
		p.log.warn("Failed to seed database. Run `pnpm db:seed:local` manually.");
	}
}

function tryExec(command: string, cwd: string): { success: boolean; stdout: string; stderr: string } {
	try {
		const stdout = execSync(command, {
			cwd,
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});
		return { success: true, stdout, stderr: "" };
	} catch (err: unknown) {
		const execErr = err as { stdout?: string; stderr?: string };
		return {
			success: false,
			stdout: execErr.stdout ?? "",
			stderr: execErr.stderr ?? "",
		};
	}
}
