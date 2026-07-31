#!/usr/bin/env node
/**
 * verify-ci.mjs — Verify GitHub Actions CI for the exact head commit.
 *
 * Usage: node scripts/verify-ci.mjs [--branch <branch>] [--timeout <seconds>]
 *
 * Polls GitHub API for the most recent workflow runs on the current SHA.
 * Exits 0 only when all required checks pass.
 * Exits 1 on failure or timeout.
 */

import { execSync } from "child_process";

const REQUIRED_JOBS = ["Validate", "Branch Policy"];
const POLL_INTERVAL_MS = 15_000;
const DEFAULT_TIMEOUT_S = 600;

const args = process.argv.slice(2);
const timeoutArg = args[args.indexOf("--timeout") + 1];
const TIMEOUT_MS = (parseInt(timeoutArg ?? DEFAULT_TIMEOUT_S, 10)) * 1000;
const REPO = "skysthelimitpainting1779-collab/skys-the-limit-platform";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

const sha = sh("git rev-parse HEAD");
const branch = sh("git branch --show-current");

console.log(`\n▶ verify-ci: watching SHA ${sha} on branch '${branch}'`);
console.log(`  Required jobs: ${REQUIRED_JOBS.join(", ")}`);
console.log(`  Timeout: ${TIMEOUT_MS / 1000}s\n`);

const start = Date.now();

while (Date.now() - start < TIMEOUT_MS) {
  let runs;
  try {
    const raw = sh(
      `gh api "/repos/${REPO}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=5" --jq ".workflow_runs"`
    );
    runs = JSON.parse(raw);
  } catch {
    console.log("  ⚠ Failed to fetch workflow runs, retrying...");
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    continue;
  }

  // Find runs for our exact SHA
  const ourRuns = runs.filter((r) => r.head_sha === sha);
  if (ourRuns.length === 0) {
    console.log(`  ⏳ No workflow runs found for SHA ${sha.slice(0, 8)} yet...`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    continue;
  }

  // Check status of each run
  const completed = ourRuns.filter((r) => r.status === "completed");
  const pending = ourRuns.filter((r) => r.status !== "completed");

  if (pending.length > 0) {
    const names = pending.map((r) => r.name).join(", ");
    console.log(`  ⏳ In progress: ${names}`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    continue;
  }

  // All completed — check conclusions
  const failures = completed.filter(
    (r) => r.conclusion !== "success" && r.conclusion !== "skipped"
  );

  if (failures.length > 0) {
    console.error(`\n✗ CI FAILED for SHA ${sha.slice(0, 8)}:`);
    for (const run of failures) {
      console.error(`  ${run.name}: ${run.conclusion}`);
      console.error(`  URL: ${run.html_url}`);
    }
    process.exit(1);
  }

  console.log(`\n✓ All CI checks passed for SHA ${sha.slice(0, 8)}`);
  for (const run of completed) {
    console.log(`  ✓ ${run.name}: ${run.conclusion}`);
  }
  process.exit(0);
}

console.error(`\n✗ Timed out after ${TIMEOUT_MS / 1000}s waiting for CI`);
process.exit(1);
