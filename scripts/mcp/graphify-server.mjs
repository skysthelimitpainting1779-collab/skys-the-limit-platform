#!/usr/bin/env node
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const child = spawn("graphify-mcp", ["--graph", join(root, "graphify-out", "graph.json")], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

child.once("error", (error) => {
  process.stderr.write(`graphify-mcp failed to start: ${error.message}\n`);
  process.exit(1);
});
child.once("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
