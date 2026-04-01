import { describe, it, expect } from "vitest";
import {
	parseAccountInfo,
	parseD1DatabaseId,
	parseKvNamespaceId,
	extractErrorMessage,
} from "../cloudflare-setup.js";

describe("parseAccountInfo", () => {
	it("extracts email from OAuth token output", () => {
		const output = `
 ⛅️ wrangler 4.79.0
───────────────────
Getting User settings...
👋 You are logged in with an OAuth Token, associated with the email user@example.com.
┌──────────────────────────┬──────────────────────────────────┐
│ Account Name             │ Account ID                       │
├──────────────────────────┼──────────────────────────────────┤
│ User's Account           │ 1cc5f5b0430f072ec6a83b0292815127 │
└──────────────────────────┴──────────────────────────────────┘`;

		expect(parseAccountInfo(output)).toBe("user@example.com");
	});

	it("extracts email with trailing period", () => {
		const output =
			"👋 You are logged in with an OAuth Token, associated with the email user@example.com.";
		expect(parseAccountInfo(output)).toBe("user@example.com");
	});

	it("falls back to account name from table when no email line", () => {
		const output = `
┌──────────────────────────┬──────────────────────────────────┐
│ Account Name             │ Account ID                       │
├──────────────────────────┼──────────────────────────────────┤
│ My Cool Account          │ abcdef01234567890abcdef012345678 │
└──────────────────────────┴──────────────────────────────────┘`;

		expect(parseAccountInfo(output)).toBe("My Cool Account");
	});

	it("returns null for unrecognized output", () => {
		expect(parseAccountInfo("some random output")).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(parseAccountInfo("")).toBeNull();
	});
});

describe("parseD1DatabaseId", () => {
	it("extracts ID from JSON format (wrangler 4.x)", () => {
		const output = `
 ⛅️ wrangler 4.79.0
───────────────────
✅ Successfully created DB 'my-app-db' in region WNAM
Created your new D1 database.

To access your new D1 Database in your Worker, add the following snippet to your configuration file:
{
  "d1_databases": [
    {
      "binding": "my_app_db",
      "database_name": "my-app-db",
      "database_id": "83897af2-39a4-43d5-910a-d7b22ffbe86a"
    }
  ]
}`;

		expect(parseD1DatabaseId(output)).toBe("83897af2-39a4-43d5-910a-d7b22ffbe86a");
	});

	it("extracts ID from TOML format (older wrangler)", () => {
		const output = `
✅ Successfully created DB 'my-app-db'
[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "abcd1234-5678-9abc-def0-1234567890ab"`;

		expect(parseD1DatabaseId(output)).toBe("abcd1234-5678-9abc-def0-1234567890ab");
	});

	it("extracts ID via UUID fallback when format is unexpected", () => {
		const output =
			"✅ Successfully created DB 'test-db' in region ENAM\nID: deadbeef-1234-5678-9abc-def012345678";
		expect(parseD1DatabaseId(output)).toBe("deadbeef-1234-5678-9abc-def012345678");
	});

	it("handles ANSI color codes in output", () => {
		const output = `\x1b[32m✅\x1b[0m Successfully created DB 'my-db'
{
  "d1_databases": [
    {
      "binding": "my_db",
      "database_name": "my-db",
      "database_id": "11111111-2222-3333-4444-555555555555"
    }
  ]
}`;

		expect(parseD1DatabaseId(output)).toBe("11111111-2222-3333-4444-555555555555");
	});

	it("returns null when no ID present", () => {
		expect(parseD1DatabaseId("some error output")).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(parseD1DatabaseId("")).toBeNull();
	});

	it("does not match UUID that is not preceded by success message", () => {
		const output = "error: 12345678-1234-1234-1234-123456789abc something failed";
		expect(parseD1DatabaseId(output)).toBeNull();
	});
});

describe("parseKvNamespaceId", () => {
	it("extracts ID from JSON format (wrangler 4.x)", () => {
		const output = `
🌀 Creating namespace "APP_KV"
✅ Success!
Add the following to your configuration file:
{
  "kv_namespaces": [
    {
      "binding": "APP_KV",
      "id": "abcdef01234567890abcdef012345678"
    }
  ]
}`;

		expect(parseKvNamespaceId(output)).toBe("abcdef01234567890abcdef012345678");
	});

	it("extracts ID from TOML format (older wrangler)", () => {
		const output = `
🌀 Creating namespace "APP_KV"
✅ Success!
Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "APP_KV"
id = "abcdef01234567890abcdef012345678"`;

		expect(parseKvNamespaceId(output)).toBe("abcdef01234567890abcdef012345678");
	});

	it("returns null when no ID present", () => {
		expect(parseKvNamespaceId("some error output")).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(parseKvNamespaceId("")).toBeNull();
	});

	it("does not match non-hex IDs", () => {
		const output = '{ "id": "not-a-hex-id-at-all-nope" }';
		expect(parseKvNamespaceId(output)).toBeNull();
	});
});

describe("extractErrorMessage", () => {
	it("extracts message from wrangler ERROR format with ANSI codes", () => {
		const output = `\x1b[31m✘ \x1b[41;31m[\x1b[41;97mERROR\x1b[41;31m]\x1b[0m \x1b[1mA KV namespace with the title "APP_KV" already exists.\x1b[0m`;
		expect(extractErrorMessage(output)).toBe(
			'A KV namespace with the title "APP_KV" already exists.',
		);
	});

	it("extracts message from plain ERROR format", () => {
		const output = "[ERROR] Database already exists";
		expect(extractErrorMessage(output)).toBe("Database already exists");
	});

	it("includes detail lines after ERROR headline", () => {
		const output = `✘ [ERROR] A request to the Cloudflare API (/accounts/abc123/r2/buckets) failed.

  A bucket with this name already exists. [code: 10004]

  If you think this is a bug, please open an issue at:
  https://github.com/cloudflare/workers-sdk/issues/new/choose`;
		expect(extractErrorMessage(output)).toBe(
			"A request to the Cloudflare API (/accounts/abc123/r2/buckets) failed.\n  A bucket with this name already exists. [code: 10004]",
		);
	});

	it("includes multiple detail lines after ERROR headline", () => {
		const output = `✘ [ERROR] A request to the Cloudflare API (/accounts/abc123/queues) failed.

  workers.api.error.not_entitled [code: 10023]
  You need to enable Queues for your account.

  If you think this is a bug, please open an issue at:
  https://github.com/cloudflare/workers-sdk/issues/new/choose`;
		expect(extractErrorMessage(output)).toBe(
			"A request to the Cloudflare API (/accounts/abc123/queues) failed.\n  workers.api.error.not_entitled [code: 10023]\n  You need to enable Queues for your account.",
		);
	});

	it("falls back to first non-empty line", () => {
		const output = "\n\nSomething went wrong\nMore details here";
		expect(extractErrorMessage(output)).toBe("Something went wrong");
	});

	it("returns unknown error for empty string", () => {
		expect(extractErrorMessage("")).toBe("unknown error");
	});
});
