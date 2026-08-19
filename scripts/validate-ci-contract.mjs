#!/usr/bin/env node

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workflowDirectory = join(process.cwd(), ".github", "workflows");
const workflowFiles = readdirSync(workflowDirectory)
  .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
  .sort();

const immutableActionRef = /^[0-9a-f]{40}$/;
const findings = [];

for (const file of workflowFiles) {
  const source = readFileSync(join(workflowDirectory, file), "utf8");
  const lines = source.split("\n");

  lines.forEach((line, index) => {
    const uses = line.match(/^\s*-?\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/);
    if (uses && !uses[1].startsWith("./")) {
      const [action, ref] = uses[1].split("@");
      if (!action || !ref || !immutableActionRef.test(ref)) {
        findings.push(
          `${file}:${index + 1} external action must use a 40-character commit SHA: ${uses[1]}`
        );
      }
    }

    if (/^\s*run:\s*npm ci\s*$/.test(line)) {
      findings.push(
        `${file}:${index + 1} npm ci must include --ignore-scripts for untrusted pull-request safety`
      );
    }
  });
}

const ciSource = readFileSync(join(workflowDirectory, "ci.yml"), "utf8");
for (const requiredCommand of [
  "npm run verify:ci-contract",
  "npm run verify:skills",
  "npm run verify:env",
  "npm run lint",
  "npm run typecheck",
  "npm test",
]) {
  if (!ciSource.includes(requiredCommand)) {
    findings.push(`ci.yml must run ${requiredCommand}`);
  }
}

const securitySource = readFileSync(join(workflowDirectory, "security.yml"), "utf8");
if (!securitySource.includes("npm audit --audit-level=high")) {
  findings.push("security.yml must audit the full locked dependency tree at high severity");
}

if (findings.length > 0) {
  console.error("[ci-contract] Workflow integrity contract failed:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log(
  `[ci-contract] Verified ${workflowFiles.length} workflow(s): immutable actions, safe npm installs, and required CI gates.`
);
