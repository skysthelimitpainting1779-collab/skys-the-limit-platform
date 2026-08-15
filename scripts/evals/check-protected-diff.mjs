import { execFileSync } from "node:child_process";

const base = process.argv[2] ?? "origin/dev";
const paths = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
const protectedPath = (path) => path === ".agents/evals/QUALITY_CONSTITUTION.md" || path === ".agents/evals/thresholds.json" || /^\.agents\/evals\/(?:metrics|public|held-out|rubrics|fixtures\/protected)\//.test(path);
const changed = paths.filter(protectedPath);
let baseHasConstitution = true;
try { execFileSync("git", ["cat-file", "-e", `${base}:.agents/evals/QUALITY_CONSTITUTION.md`], { stdio: "ignore" }); }
catch { baseHasConstitution = false; }
if (!changed.length) {
  console.log("PASS protected evaluation authority unchanged");
} else if (!baseHasConstitution && changed.includes(".agents/evals/QUALITY_CONSTITUTION.md")) {
  console.log(`PASS one-time protected evaluation bootstrap (${changed.length} protected artifacts)`);
} else {
  console.error(`FAIL protected evaluation authority changed by candidate:\n${changed.join("\n")}\nUse a separate human-governor change; proposer branches cannot move the bar.`);
  process.exit(1);
}
