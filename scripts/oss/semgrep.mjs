#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const executable = process.platform === "win32" ? "uvx.exe" : "uvx";
const result = spawnSync(
  executable,
  ["--from", "semgrep==1.173.0", "semgrep", "scan", "--metrics=off", "--json", "--error", "--config", ".semgrep.yml", "src", "convex"],
  { cwd: root, encoding: "utf8", timeout: 180_000, maxBuffer: 20 * 1024 * 1024 },
);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
