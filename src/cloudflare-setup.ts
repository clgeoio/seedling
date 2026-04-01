import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import * as p from "@clack/prompts";
import fs from "fs-extra";
import pc from "picocolors";
import type { ProjectOptions } from "./types.js";

const WRANGLER = "pnpm exec wrangler";
const EXEC_TIMEOUT_MS = 30_000;

interface ResourceIds {
	d1DatabaseId: string | null;
	kvNamespaceId: string | null;
}

export async function setupCloudflare(
	options: ProjectOptions,
	targetDir: string,
): Promise<boolean> {
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
		const account = parseAccountInfo(whoami.output);
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

	const account = parseAccountInfo(verify.output);
	if (account) {
		p.log.success(`Authenticated as ${pc.cyan(account)}`);
	}
	return true;
}

export function parseAccountInfo(whoamiOutput: string): string | null {
	const emailMatch = whoamiOutput.match(/associated with the email\s+(\S+)/i);
	if (emailMatch?.[1]) return emailMatch[1].replace(/\.?$/, "");

	const tableMatch = whoamiOutput.match(/│\s*([^│]+?)\s*│\s*[a-f0-9]{32}\s*│/);
	if (tableMatch?.[1]) return tableMatch[1].trim();

	return null;
}

export function parseD1DatabaseId(output: string): string | null {
	const jsonMatch = output.match(/"database_id"\s*:\s*"([^"]+)"/);
	if (jsonMatch?.[1]) return jsonMatch[1];

	const tomlMatch = output.match(/database_id\s*=\s*"([^"]+)"/);
	if (tomlMatch?.[1]) return tomlMatch[1];

	const uuidMatch = output.match(
		/Successfully created DB[\s\S]*?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
	);
	if (uuidMatch?.[1]) return uuidMatch[1];

	return null;
}

export function parseKvNamespaceId(output: string): string | null {
	const jsonMatch = output.match(/"id"\s*:\s*"([0-9a-f]{32})"/);
	if (jsonMatch?.[1]) return jsonMatch[1];

	const tomlMatch = output.match(/id\s*=\s*"([0-9a-f]{32})"/);
	if (tomlMatch?.[1]) return tomlMatch[1];

	return null;
}

export function extractErrorMessage(output: string): string {
	const clean = stripAnsi(output);
	const lines = clean.split("\n");

	const errorIdx = lines.findIndex((l) => /\[ERROR]/.test(l));
	if (errorIdx !== -1) {
		const headline = lines[errorIdx].replace(/.*\[ERROR]\s*/, "").trim();
		const details: string[] = [];
		for (let i = errorIdx + 1; i < lines.length; i++) {
			const trimmed = lines[i].trim();
			if (!trimmed) continue;
			if (/^(If you think this is a bug|https?:\/\/)/.test(trimmed)) break;
			details.push(trimmed);
		}
		if (details.length > 0) {
			return `${headline}\n  ${details.join("\n  ")}`;
		}
		return headline;
	}

	const nonEmpty = lines.filter((l) => l.trim());
	return nonEmpty[0]?.trim() ?? "unknown error";
}

function stripAnsi(str: string): string {
	return str.replace(/\x1b\[[0-9;]*m/g, "");
}

async function createResources(options: ProjectOptions, targetDir: string): Promise<ResourceIds> {
	const ids: ResourceIds = {
		d1DatabaseId: null,
		kvNamespaceId: null,
	};

	ids.d1DatabaseId = await createD1Database(options.projectName, targetDir);
	ids.kvNamespaceId = await createKvNamespace(options.projectName, targetDir);

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
		const id = parseD1DatabaseId(result.output);
		if (id) {
			p.log.success(`D1 database created: ${pc.dim(id)}`);
			return id;
		}
		p.log.warn("D1 database created but could not parse database ID from output.");
	} else {
		const errLine = extractErrorMessage(result.output);
		p.log.warn(`Failed to create D1 database: ${errLine}`);
	}

	return promptForId(`Enter D1 database ID for "${dbName}" (or leave blank to skip)`);
}

async function createKvNamespace(projectName: string, targetDir: string): Promise<string | null> {
	const kvName = `${projectName}-kv`;
	p.log.step(`Creating KV namespace "${kvName}"...`);

	const result = tryExec(`${WRANGLER} kv namespace create ${kvName}`, targetDir);
	if (result.success) {
		const id = parseKvNamespaceId(result.output);
		if (id) {
			p.log.success(`KV namespace created: ${pc.dim(id)}`);
			return id;
		}
		p.log.warn("KV namespace created but could not parse namespace ID from output.");
	} else {
		const errLine = extractErrorMessage(result.output);
		p.log.warn(`Failed to create KV namespace: ${errLine}`);
	}

	return promptForId(`Enter KV namespace ID for "${kvName}" (or leave blank to skip)`);
}

async function createR2Bucket(projectName: string, targetDir: string): Promise<void> {
	const bucketName = `${projectName}-uploads`;
	p.log.step(`Creating R2 bucket "${bucketName}"...`);

	const result = tryExec(`${WRANGLER} r2 bucket create ${bucketName}`, targetDir);
	if (result.success) {
		p.log.success(`R2 bucket "${bucketName}" created`);
	} else {
		const errLine = extractErrorMessage(result.output);
		p.log.warn(`Failed to create R2 bucket: ${errLine}`);
	}
}

async function createQueue(projectName: string, targetDir: string): Promise<void> {
	const queueName = `${projectName}-tasks`;
	p.log.step(`Creating Queue "${queueName}"...`);

	const result = tryExec(`${WRANGLER} queues create ${queueName}`, targetDir);
	if (result.success) {
		p.log.success(`Queue "${queueName}" created`);
	} else {
		const errLine = extractErrorMessage(result.output);
		p.log.warn(`Failed to create Queue: ${errLine}`);
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
		execSync(`${WRANGLER} d1 execute DB --local --file=drizzle/seed/seed.sql`, {
			cwd: targetDir,
			stdio: "inherit",
		});
		p.log.success("Local database seeded");
	} catch {
		p.log.warn("Failed to seed database. Run `pnpm db:seed:local` manually.");
	}
}

interface ExecResult {
	success: boolean;
	stdout: string;
	stderr: string;
	output: string;
}

function tryExec(command: string, cwd: string): ExecResult {
	const result = spawnSync(command, {
		cwd,
		encoding: "utf-8",
		shell: true,
		stdio: ["pipe", "pipe", "pipe"],
		timeout: EXEC_TIMEOUT_MS,
	});

	const stdout = result.stdout ?? "";
	const stderr = result.stderr ?? "";

	return {
		success: result.status === 0,
		stdout,
		stderr,
		output: `${stdout}\n${stderr}`,
	};
}
