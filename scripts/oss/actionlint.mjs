#!/usr/bin/env node
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runTool } from "./toolchain.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const workflows = readdirSync(join(root, ".github", "workflows"), { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
  .map((entry) => join(root, ".github", "workflows", entry.name));
const result = await runTool("actionlint", workflows);
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
