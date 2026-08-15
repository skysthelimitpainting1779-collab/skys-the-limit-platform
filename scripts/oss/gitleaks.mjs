#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureTool } from "./toolchain.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const baseRef = process.argv[2] ?? (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "origin/dev");
const mergeBase = spawnSync("git", ["merge-base", baseRef, "HEAD"], { cwd: root, encoding: "utf8" });
if (mergeBase.status !== 0 || !/^[0-9a-f]{40}\s*$/i.test(mergeBase.stdout)) {
  throw new Error(`Unable to establish Gitleaks base from ${baseRef}: ${mergeBase.stderr || mergeBase.stdout}`);
}
const { binaryPath } = await ensureTool("gitleaks");
const result = spawnSync(
  binaryPath,
  ["git", root, `--log-opts=${mergeBase.stdout.trim()}..HEAD`, "--no-banner", "--no-color", "--redact=100", "--report-format", "json", "--report-path=-"],
  { cwd: root, encoding: "utf8", timeout: 120_000, maxBuffer: 20 * 1024 * 1024 },
);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
