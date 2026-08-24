#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runTool } from "./toolchain.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const result = await runTool("zizmor", ["--offline", "--min-severity", "medium", "--min-confidence", "medium", "--format", "plain", root]);
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
