#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "AGENTS.md",
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  ".github/CODEOWNERS",
  ".github/pull_request_template.md",
  ".github/dependabot.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/ISSUE_TEMPLATE/bug.yml",
  ".github/ISSUE_TEMPLATE/feature.yml",
];
const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`required governance file missing: ${file}`);
}

if (existsSync("AGENTS.md")) {
  const agents = readFileSync("AGENTS.md", "utf8");
  for (const heading of [
    "Tool availability",
    "Truth before completion",
    "Verification contract",
    "Production-effect gates",
  ]) {
    if (!agents.includes(`## ${heading}`) && !agents.match(new RegExp(`## \\d+\\. ${heading}`))) {
      failures.push(`AGENTS.md missing heading: ${heading}`);
    }
  }

  const deadlockPatterns = [
    /every (?:sub)?agent must (?:use|activate).*graphify/i,
    /every (?:sub)?agent must (?:use|activate).*make-no-mistakes/i,
    /every (?:sub)?agent must (?:use|activate).*gstack/i,
    /if context7 is unavailable, stop/i,
  ];
  for (const pattern of deadlockPatterns) {
    if (pattern.test(agents)) failures.push(`AGENTS.md contains optional-tool deadlock: ${pattern}`);
  }
}

if (existsSync(".github/pull_request_template.md")) {
  const template = readFileSync(".github/pull_request_template.md", "utf8");
  for (const required of [
    "Exact head SHA",
    "Immutable Vercel Preview",
    "Production and cost effects",
    "Rollback",
  ]) {
    if (!template.includes(required)) failures.push(`PR template missing: ${required}`);
  }
}

if (failures.length > 0) {
  console.error("Governance validation FAILED:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("governance: ok");
