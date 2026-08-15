#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { sha256, validatePacket } from "./packet-lib.mjs";

const args = process.argv.slice(2);
const option = (name) => args[args.indexOf(name) + 1];
const required = ["task", "verifier", "base", "candidate", "acceptance", "graphify", "context7", "tests", "out"];
for (const name of required) if (!option(`--${name}`)) { console.error(`Missing --${name}`); process.exit(2); }
const exact = (revision) => execFileSync("git", ["rev-parse", `${revision}^{commit}`], { encoding: "utf8" }).trim();
const base = exact(option("--base"));
const candidate = exact(option("--candidate"));
try { execFileSync("git", ["merge-base", "--is-ancestor", base, candidate], { stdio: "ignore" }); }
catch { console.error("Base must be an ancestor of candidate"); process.exit(1); }
const evidence = (path) => {
  const absolute = resolve(path);
  const text = readFileSync(absolute, "utf8");
  return { path: absolute.replaceAll("\\", "/"), sha256: sha256(text), text };
};
const diffText = execFileSync("git", ["diff", "--no-ext-diff", "--unified=3", base, candidate], { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 });
const packet = {
  schema_version: "1.0.0",
  task_contract_id: option("--task"),
  verifier: option("--verifier").toUpperCase(),
  base_commit_sha: base,
  candidate_commit_sha: candidate,
  diff: { sha256: sha256(diffText), text: diffText },
  acceptance_criteria: evidence(option("--acceptance")),
  graphify_evidence: evidence(option("--graphify")),
  context7_evidence: evidence(option("--context7")),
  test_evidence: evidence(option("--tests")),
  prohibited_context_absent: true
};
const failures = validatePacket(packet);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
const output = resolve(option("--out"));
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(packet, null, 2)}\n`);
console.log(`PASS verifier packet ${packet.verifier} ${candidate} -> ${output}`);
