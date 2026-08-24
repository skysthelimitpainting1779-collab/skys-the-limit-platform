#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runTool } from "./toolchain.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const tracked = spawnSync(
  "git",
  ["ls-files", "-z", "--", "README.md", "AGENTS.md", ":(glob)docs/**/*.md", ":(glob).agents/decisions/**/*.md"],
  { cwd: root, encoding: "utf8" },
);
if (tracked.status !== 0) throw new Error(tracked.stderr || "Unable to enumerate canonical documentation");
const files = tracked.stdout.split("\0").filter(Boolean);
if (files.length === 0) throw new Error("No canonical documentation files found");
const result = await runTool("lychee", ["--offline", "--no-progress", "--mode", "plain", "--root-dir", root, ...files]);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
