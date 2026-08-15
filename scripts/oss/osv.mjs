#!/usr/bin/env node
import { runTool } from "./toolchain.mjs";

const result = await runTool("osv-scanner", ["scan", "-L", "package-lock.json", "--format", "json"]);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
