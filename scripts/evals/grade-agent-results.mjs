import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { gradeCases, loadJson } from "./lib.mjs";

const args = new Map(process.argv.slice(2).map((value, index, list) => value.startsWith("--") ? [value.slice(2), list[index + 1]] : ["", ""]));
const suiteName = args.get("suite") ?? "public";
const resultsPath = args.get("results");
if (!resultsPath || !new Set(["public", "held-out"]).has(suiteName)) {
  console.error("Usage: node scripts/evals/grade-agent-results.mjs --suite public|held-out --results <file> [--out <file>]");
  process.exit(2);
}
const cases = loadJson(`.agents/evals/${suiteName}/cases.json`).cases;
const results = loadJson(resultsPath);
const report = { schema_version: "1.0.0", suite: suiteName, host: results.host, candidate_sha: results.candidate_sha, ...gradeCases(cases, results.results ?? []) };
const output = `${JSON.stringify(report, null, 2)}\n`;
if (args.get("out")) {
  const path = resolve(args.get("out"));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, output);
} else process.stdout.write(output);
if (report.passed !== report.total) process.exitCode = 1;
