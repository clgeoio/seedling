import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { scaffold } from "../scaffold.js";
import type { ProjectOptions } from "../types.js";

function baseOptions(overrides: Partial<ProjectOptions> = {}): ProjectOptions {
	return {
		projectName: "snapshot-test",
		displayName: "Snapshot Test",
		socialProviders: [],
		includeAdmin: false,
		includeR2: false,
		includeTodos: false,
		includeCron: false,
		includeQueues: false,
		installDeps: false,
		initGit: false,
		setupCloudflare: false,
		...overrides,
	};
}

async function getFileTree(dir: string): Promise<string[]> {
	const files: string[] = [];

	async function walk(current: string): Promise<void> {
		const entries = await fs.readdir(current, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(current, entry.name);
			const relativePath = path.relative(dir, fullPath);
			if (entry.isDirectory()) {
				if (entry.name === "node_modules" || entry.name === ".git") continue;
				await walk(fullPath);
			} else {
				files.push(relativePath);
			}
		}
	}

	await walk(dir);
	return files.sort();
}

let tmpDir: string;

beforeEach(async () => {
	tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "seedling-test-"));
});

afterEach(async () => {
	await fs.remove(tmpDir);
});

describe("scaffold file tree snapshots", () => {
	it("minimal - no optional features", async () => {
		const opts = baseOptions();
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			const targetDir = await scaffold(opts);
			const files = await getFileTree(targetDir);
			expect(files).toMatchSnapshot();

			// Verify key exclusions
			expect(files).not.toContain(expect.stringContaining("admin"));
			expect(files).not.toContain(expect.stringContaining("todos"));
			expect(files).not.toContain("app/services/r2.server.ts");
			expect(files).not.toContain("app/routes/images.ts");
			expect(files.some((f) => f.startsWith("app/crons/"))).toBe(false);
			expect(files.some((f) => f.startsWith("app/queues/"))).toBe(false);

			// Verify key inclusions
			expect(files).toContain("app/root.tsx");
			expect(files).toContain("app/routes.ts");
			expect(files).toContain("app/routes/auth/sign-in.tsx");
			expect(files).toContain("workers/app.ts");
			expect(files).toContain(".gitignore");
			expect(files).toContain("package.json");
		} finally {
			process.chdir(origCwd);
		}
	});

	it("all features enabled", async () => {
		const opts = baseOptions({
			projectName: "full-test",
			displayName: "Full Test",
			socialProviders: ["github", "google"],
			includeAdmin: true,
			includeR2: true,
			includeTodos: true,
			includeCron: true,
			includeQueues: true,
		});
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			const targetDir = await scaffold(opts);
			const files = await getFileTree(targetDir);
			expect(files).toMatchSnapshot();

			// Verify all optional files present
			expect(files).toContain("app/routes/admin/dashboard.tsx");
			expect(files).toContain("app/routes/admin/users/index.tsx");
			expect(files).toContain("app/routes/todos.tsx");
			expect(files).toContain("app/routes/images.ts");
			expect(files).toContain("app/services/r2.server.ts");
			expect(files).toContain("app/services/auth/permissions.ts");
			expect(files).toContain("drizzle/schema/todo.ts");
			expect(files.some((f) => f.startsWith("app/crons/"))).toBe(true);
			expect(files.some((f) => f.startsWith("app/queues/"))).toBe(true);
		} finally {
			process.chdir(origCwd);
		}
	});

	it("mixed - todos + cron, no admin/R2/queues", async () => {
		const opts = baseOptions({
			projectName: "mixed-test",
			socialProviders: ["github"],
			includeTodos: true,
			includeCron: true,
		});
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			const targetDir = await scaffold(opts);
			const files = await getFileTree(targetDir);
			expect(files).toMatchSnapshot();

			expect(files).toContain("app/routes/todos.tsx");
			expect(files).toContain("drizzle/schema/todo.ts");
			expect(files.some((f) => f.startsWith("app/crons/"))).toBe(true);
			expect(files.some((f) => f.startsWith("app/routes/admin/"))).toBe(false);
			expect(files.some((f) => f.startsWith("app/queues/"))).toBe(false);
			expect(files).not.toContain("app/routes/images.ts");
		} finally {
			process.chdir(origCwd);
		}
	});
});

describe("scaffold template processing", () => {
	it("substitutes project name in package.json", async () => {
		const opts = baseOptions({ projectName: "my-cool-app", displayName: "My Cool App" });
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			const targetDir = await scaffold(opts);
			const pkg = await fs.readJson(path.join(targetDir, "package.json"));
			expect(pkg.name).toBe("my-cool-app");
		} finally {
			process.chdir(origCwd);
		}
	});

	it("removes social provider blocks when none selected", async () => {
		const opts = baseOptions();
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			const targetDir = await scaffold(opts);
			const signIn = await fs.readFile(
				path.join(targetDir, "app/routes/auth/sign-in.tsx"),
				"utf-8",
			);
			expect(signIn).not.toContain("GitHub");
			expect(signIn).not.toContain("Google");
			expect(signIn).not.toContain("{{#if");
		} finally {
			process.chdir(origCwd);
		}
	});

	it("keeps social provider blocks when selected", async () => {
		const opts = baseOptions({ socialProviders: ["github"] });
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			const targetDir = await scaffold(opts);
			const signIn = await fs.readFile(
				path.join(targetDir, "app/routes/auth/sign-in.tsx"),
				"utf-8",
			);
			expect(signIn).toContain("GitHub");
			expect(signIn).not.toContain("Google");
		} finally {
			process.chdir(origCwd);
		}
	});

	it("removes cron handler from worker when cron disabled", async () => {
		const opts = baseOptions();
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			const targetDir = await scaffold(opts);
			const worker = await fs.readFile(path.join(targetDir, "workers/app.ts"), "utf-8");
			expect(worker).not.toContain("scheduled");
			expect(worker).not.toContain("handleScheduled");
		} finally {
			process.chdir(origCwd);
		}
	});

	it("keeps queue handler in worker when queues enabled", async () => {
		const opts = baseOptions({ includeQueues: true });
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			const targetDir = await scaffold(opts);
			const worker = await fs.readFile(path.join(targetDir, "workers/app.ts"), "utf-8");
			expect(worker).toContain("queue");
			expect(worker).toContain("handleQueue");
		} finally {
			process.chdir(origCwd);
		}
	});

	it("produces no leftover template syntax in any file", async () => {
		const opts = baseOptions({
			socialProviders: ["github", "google"],
			includeAdmin: true,
			includeR2: true,
			includeTodos: true,
			includeCron: true,
			includeQueues: true,
		});
		const origCwd = process.cwd();
		process.chdir(tmpDir);
		try {
			const targetDir = await scaffold(opts);
			const files = await getFileTree(targetDir);

			for (const file of files) {
				const fullPath = path.join(targetDir, file);
				const ext = path.extname(file);
				const textExts = new Set([
					".ts",
					".tsx",
					".js",
					".json",
					".jsonc",
					".css",
					".yml",
					".sql",
					".cjs",
				]);
				if (!textExts.has(ext) && !file.startsWith(".")) continue;

				const content = await fs.readFile(fullPath, "utf-8");
				expect(content, `File ${file} contains template syntax`).not.toMatch(
					/\{\{#(?:if|unless)\s+\w+\}\}/,
				);
				expect(content, `File ${file} contains closing template syntax`).not.toMatch(
					/\{\{\/(?:if|unless)\}\}/,
				);
				expect(content, `File ${file} contains unsubstituted variable`).not.toMatch(
					/\{\{projectName\}\}/,
				);
				expect(content, `File ${file} contains unsubstituted variable`).not.toMatch(
					/\{\{displayName\}\}/,
				);
			}
		} finally {
			process.chdir(origCwd);
		}
	});
});
