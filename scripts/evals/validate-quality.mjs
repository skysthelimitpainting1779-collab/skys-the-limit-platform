import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const failures = [];
const requiredAgents = Array.from({ length: 11 }, (_, index) => `A${index}`);
const requiredVerifiers = Array.from({ length: 11 }, (_, index) => `V${index}`);
const highRisk = ["A0", "A2", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "V6", "V10"];

for (const path of [".agents/evals/QUALITY_CONSTITUTION.md", ".agents/evals/thresholds.json", ".agents/evals/metrics/agents.json", ".agents/evals/metrics/verifiers.json", ".agents/evals/rubrics/qualitative.json", ".agents/evals/public/cases.json", ".agents/evals/held-out/cases.json"]) {
  if (!existsSync(join(root, path))) failures.push(`missing ${path}`);
}

const thresholds = read(".agents/evals/thresholds.json");
const agentMetrics = read(".agents/evals/metrics/agents.json");
const verifierMetrics = read(".agents/evals/metrics/verifiers.json");
const researchMetrics = read(".agents/evals/metrics/research.json");
const rubric = read(".agents/evals/rubrics/qualitative.json");
const publicCases = read(".agents/evals/public/cases.json").cases;
const heldOutCases = read(".agents/evals/held-out/cases.json").cases;

for (const subject of requiredAgents) {
  if (!agentMetrics.subjects[subject]) failures.push(`${subject} has no metrics`);
  if (!publicCases.some((item) => item.subject === subject)) failures.push(`${subject} has no public behavioral case`);
}
for (const subject of requiredVerifiers) {
  if (!verifierMetrics.subjects[subject]) failures.push(`${subject} has no metrics`);
  if (!publicCases.some((item) => item.subject === subject)) failures.push(`${subject} has no public behavioral case`);
}
if (!researchMetrics.subjects.R0) failures.push("R0 has no research metrics");
if (!publicCases.some((item) => item.subject === "R0")) failures.push("R0 has no public behavioral case");
for (const subject of highRisk) if (!heldOutCases.some((item) => item.subject === subject)) failures.push(`${subject} has no held-out case`);

const a4Tags = new Set(heldOutCases.filter((item) => item.subject === "A4").flatMap((item) => item.tags ?? []));
for (const tag of ["long-data", "empty-state", "request-failure", "slow-request", "duplicate-action", "keyboard-only", "narrow-viewport"]) if (!a4Tags.has(tag)) failures.push(`A4 held-out missing ${tag}`);
const a10Tags = new Set(heldOutCases.filter((item) => item.subject === "A10").flatMap((item) => item.tags ?? []));
for (const tag of ["old-ci", "wrong-preview", "security", "missing-evidence", "valid"]) if (!a10Tags.has(tag)) failures.push(`A10 held-out missing ${tag}`);
const v10Tags = new Set(heldOutCases.filter((item) => item.subject === "V10").flatMap((item) => item.tags ?? []));
for (const tag of ["obvious-pass", "obvious-fail", "subtle-fail", "insufficient-evidence", "adversarial-summary"]) if (!v10Tags.has(tag)) failures.push(`V10 held-out missing ${tag}`);
const r0Tags = new Set(heldOutCases.filter((item) => item.subject === "R0").flatMap((item) => item.tags ?? []));
for (const tag of ["existing-project", "native-convex", "maintained-oss", "custom-smaller", "fashionable-inappropriate", "abandoned-readme", "incompatible-license", "operational-tradeoff"]) if (!r0Tags.has(tag)) failures.push(`R0 held-out missing ${tag}`);

if (verifierMetrics.defaults.false_pass_rate.max !== 0) failures.push("verifier false_pass_rate must be zero");
for (const subject of ["V5", "V6", "V7", "V10"]) if (verifierMetrics.subjects[subject].false_pass_penalty !== 100) failures.push(`${subject} false-PASS penalty must be 100`);
if (!rubric.judge_output.required.includes("reason") || rubric.judge_output.empty_reason_allowed !== false) failures.push("judge reason is not mandatory");
for (const value of Object.values(thresholds.global_invariants)) if (value !== 0) failures.push("global invariants must have zero tolerance");
for (const path of [".agents/evals/QUALITY_CONSTITUTION.md", ".agents/evals/thresholds.json", ".agents/evals/metrics/**", ".agents/evals/public/**", ".agents/evals/held-out/**", ".agents/evals/rubrics/**"]) if (!thresholds.governance.protected_paths.includes(path)) failures.push(`protected path missing: ${path}`);

if (failures.length) {
  console.error(failures.map((item) => `FAIL ${item}`).join("\n"));
  process.exit(1);
}
console.log(`PASS quality contract: ${requiredAgents.length} agents, ${requiredVerifiers.length} verifiers, ${publicCases.length} public cases, ${heldOutCases.length} held-out cases`);
