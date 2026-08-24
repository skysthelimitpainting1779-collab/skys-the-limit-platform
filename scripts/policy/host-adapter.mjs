#!/usr/bin/env node
import { evaluatePreTool } from "./core.mjs";

const argv = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : fallback;
};
const host = option("--host", "codex");
const event = option("--event", "PreToolUse");
const agent = option("--agent", "");
const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const raw = Buffer.concat(chunks);
let input = {};
try { input = raw.length ? JSON.parse(raw.toString("utf8")) : {}; } catch { input = {}; }

function antigravity(decision, reason) {
  process.stdout.write(JSON.stringify(reason ? { decision, reason } : { decision }));
}

function deny(code, reason) {
  const message = `DENY [${code}]: ${reason}`;
  if (host === "antigravity") {
    antigravity("deny", message);
    process.exit(0);
  }
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

if (event === "PreToolUse") {
  const result = evaluatePreTool(input, agent);
  if (!result.allow) deny(result.code, result.reason);
  if (host === "antigravity") antigravity("allow");
} else if (event === "Stop" && host === "antigravity") {
  antigravity("stop");
} else if (host === "antigravity") {
  process.stdout.write("{}");
}
