#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const resultDir = resolve(root, ".agents", "evals", "results");
const failures = [];

function read(name) {
  return JSON.parse(readFileSync(resolve(resultDir, name), "utf8"));
}

function commitExists(sha) {
  try {
    execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], { cwd: root, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const reports = [
  read("codex-portable-kernel-v1.1.json"),
  read("antigravity-portable-kernel-v1.1.json"),
];
for (const report of reports) {
  if (report.metric_version !== "1.1.0") failures.push(`${report.host}: wrong metric version`);
  if (!commitExists(report.current_sha)) failures.push(`${report.host}: evaluated SHA is not a repository commit`);
  if (report.status !== "COMPLETE" || report.passed !== true) failures.push(`${report.host}: result is not a PASS`);
  if (report.candidate?.passed !== report.candidate?.total || report.candidate?.total !== 10) failures.push(`${report.host}: portable kernel did not pass 10/10`);
  if (report.delta_passed < 1 || report.causal_improvement !== true) failures.push(`${report.host}: zero-injection control shows no causal lift`);
  if (report.regressions?.length) failures.push(`${report.host}: regressions detected`);
}

const antigravity = reports.find((report) => report.host === "antigravity");
if (antigravity?.discovery?.only_root !== true || antigravity?.discovery?.workspace_roots?.join(",") !== "A0") {
  failures.push("Antigravity did not discover exactly A0 as the workspace root");
}

const smoke = JSON.parse(readFileSync(resolve(root, ".agents", "evidence", "hosts", "ANTIGRAVITY_A0_V0.json"), "utf8"));
if (!commitExists(smoke.current_sha)) failures.push("Antigravity A0/V0 smoke SHA is not a repository commit");
if (smoke.root_agent !== "A0" || smoke.invoked_subagent !== "V0" || smoke.verdict !== "FAIL" || smoke.write_tool_calls !== 0) {
  failures.push("Antigravity A0/V0 smoke did not prove bounded read-only rejection");
}

const report = {
  schema_version: "1.0.0",
  passed: failures.length === 0,
  hosts: Object.fromEntries(reports.map((item) => [item.host, { version: item.host_version, baseline: `${item.baseline.passed}/${item.baseline.total}`, portable_kernel: `${item.candidate.passed}/${item.candidate.total}`, delta: item.delta_passed }])),
  antigravity_subagent: { root: smoke.root_agent, verifier: smoke.invoked_subagent, verdict: smoke.verdict, write_tool_calls: smoke.write_tool_calls, structured_output_enforced: smoke.structured_output_enforced },
  warnings: smoke.structured_output_enforced ? [] : ["Antigravity 1.1.13 stream-json omitted structured_output after the multi-turn A0→V0 run; the verdict remained machine-observable in stream events."],
  failures,
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
