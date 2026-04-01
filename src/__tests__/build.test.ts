import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import fs from "fs-extra";
import { scaffold } from "../scaffold.js";
import type { ProjectOptions } from "../types.js";

function baseOptions(overrides: Partial<ProjectOptions> = {}): ProjectOptions {
	return {
		projectName: "build-verify",
		displayName: "Build Verify",
		socialProviders: ["github", "google"],
		includeAdmin: true,
		includeR2: true,
		includeTodos: true,
		includeCron: true,
		includeQueues: true,
		installDeps: false,
		initGit: false,
		...overrides,
	};
}

function exec(cmd: string, cwd: string): string {
	try {
		return execSync(cmd, { cwd, encoding: "utf-8", timeout: 120_000, stdio: "pipe" });
	} catch (err: unknown) {
		const e = err as { stdout?: string; stderr?: string; message?: string };
		const details = [e.stdout, e.stderr, e.message].filter(Boolean).join("\n");
		throw new Error(`Command failed: ${cmd}\n${details}`);
	}
}

describe("build verification", { sequential: true }, () => {
	let tmpDir: string;
	let targetDir: string;

	beforeAll(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "seedling-build-"));
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			targetDir = await scaffold(baseOptions());
		} finally {
			process.chdir(origCwd);
		}

		exec("pnpm install --no-frozen-lockfile", targetDir);
		exec("npx react-router typegen", targetDir);
	}, 120_000);

	afterAll(async () => {
		await fs.remove(tmpDir);
	});

	it("pnpm install succeeds and produces node_modules", () => {
		expect(fs.existsSync(path.join(targetDir, "node_modules"))).toBe(true);
	});

	it("react-router typegen generates +types directories", () => {
		expect(
			fs.existsSync(path.join(targetDir, ".react-router", "types", "app", "routes", "+types")),
		).toBe(true);
	});

	it("tsc --noEmit succeeds with zero errors", () => {
		const output = exec("npx tsc --noEmit", targetDir);
		expect(output.trim()).toBe("");
	}, 30_000);

	it("react-router build succeeds", () => {
		const output = exec("npx react-router build", targetDir);
		expect(output).toContain("built in");
		expect(fs.existsSync(path.join(targetDir, "build"))).toBe(true);
	}, 60_000);
});
