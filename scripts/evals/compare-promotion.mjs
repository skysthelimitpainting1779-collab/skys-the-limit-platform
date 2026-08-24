import { evaluatePromotion, loadJson } from "./lib.mjs";

const values = process.argv.slice(2);
const value = (flag) => values[values.indexOf(flag) + 1];
const baselinePath = value("--baseline");
const candidatePath = value("--candidate");
if (!baselinePath || !candidatePath) {
  console.error("Usage: node scripts/evals/compare-promotion.mjs --baseline <report> --candidate <report>");
  process.exit(2);
}
const baseline = loadJson(baselinePath);
const candidate = loadJson(candidatePath);
const report = evaluatePromotion(baseline, candidate);
console.log(JSON.stringify(report, null, 2));
if (report.reasons.length) process.exitCode = 1;
