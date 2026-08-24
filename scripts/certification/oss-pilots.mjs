#!/usr/bin/env node
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { ensureTool } from "../oss/toolchain.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const scorecard = read(".agents/evidence/oss/priority-zero.json");
const rubric = read(".agents/reuse/candidate-rubric.json");
const packageJson = read("package.json");
const toolManifest = read(".agents/tools/oss-tools.json");
const failures = [];
const checks = {};
const expected = new Map([
  ["actionlint", "ADOPT"], ["zizmor", "ADOPT"], ["pinact", "REJECT"],
  ["dependency-cruiser", "ADOPT"], ["Promptfoo", "REJECT"], ["MCP Inspector", "ADOPT"],
  ["Playwright plus axe-core", "ADOPT"],
]);

for (const candidate of scorecard.candidates) {
  if (expected.get(candidate.name) !== candidate.decision) failures.push(`${candidate.name} decision drift`);
  if ("numeric_score" in candidate || "total_score" in candidate) failures.push(`${candidate.name} uses prohibited aggregate score`);
  for (const [section, fields] of Object.entries(rubric.sections)) {
    for (const field of fields) if (!(field in (candidate.assessment?.[section] ?? {}))) failures.push(`${candidate.name} missing ${section}.${field}`);
  }
  if (!candidate.pilot?.seeded_defect || typeof candidate.pilot.detected !== "boolean") failures.push(`${candidate.name} lacks seeded pilot evidence`);
}
if (scorecard.candidates.length !== expected.size) failures.push("priority-zero candidate inventory drift");
for (const [name, version] of [["dependency-cruiser", "18.2.0"], ["@playwright/test", "1.62.1"], ["@axe-core/playwright", "4.13.0"], ["@modelcontextprotocol/inspector", "2.2.0"]]) {
  if (packageJson.devDependencies?.[name] !== version) failures.push(`${name} is not pinned to ${version}`);
}
if (packageJson.devDependencies?.promptfoo || packageJson.dependencies?.promptfoo) failures.push("rejected Promptfoo was installed");
for (const [name, allowed] of [["esbuild@0.27.0", true], ["unrs-resolver@1.12.2", true], ["@modelcontextprotocol/inspector", false]]) {
  if (packageJson.allowScripts?.[name] !== allowed) failures.push(`${name} install-script decision drift`);
}
for (const [name, version] of [["actionlint", "1.7.12"], ["zizmor", "1.29.0"]]) if (toolManifest.tools[name]?.version !== version) failures.push(`${name} binary pin drift`);

const temp = mkdtempSync(join(tmpdir(), "sky-oss-cert-"));
try {
  const workflowDir = join(temp, ".github", "workflows");
  mkdirSync(workflowDir, { recursive: true });
  const syntaxSeed = join(workflowDir, "actionlint-seed.yml");
  writeFileSync(syntaxSeed, "name: Seed\non: [push]\njobs:\n  bad:\n    runs-on: ubuntu-latest\n    steps:\n      - name: broken\n        runs: echo broken\n");
  const actionlint = await ensureTool("actionlint");
  const syntaxResult = spawnSync(actionlint.binaryPath, [syntaxSeed], { cwd: temp, encoding: "utf8" });
  checks.actionlint_seed = syntaxResult.status !== 0 && /syntax-check|must run script/i.test(syntaxResult.stdout + syntaxResult.stderr);
  if (!checks.actionlint_seed) failures.push("actionlint missed seeded workflow defect");

  const workflows = readdirSync(join(root, ".github", "workflows"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
    .map((entry) => join(root, ".github", "workflows", entry.name));
  const actionlintReal = spawnSync(actionlint.binaryPath, workflows, { cwd: root, encoding: "utf8" });
  checks.actionlint_real = actionlintReal.status === 0;
  if (!checks.actionlint_real) failures.push(`actionlint real scan failed: ${actionlintReal.stdout || actionlintReal.stderr}`);

  const securitySeed = join(workflowDir, "zizmor-seed.yml");
  writeFileSync(securitySeed, "name: Seed\non:\n  pull_request_target:\npermissions: write-all\njobs:\n  bad:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo \"${{ github.event.pull_request.title }}\"\n");
  const zizmor = await ensureTool("zizmor");
  const zizmorSeed = spawnSync(zizmor.binaryPath, ["--offline", "--min-severity", "medium", "--format", "plain", temp], { cwd: temp, encoding: "utf8" });
  checks.zizmor_seed = zizmorSeed.status !== 0 && /dangerous-triggers/.test(zizmorSeed.stdout + zizmorSeed.stderr) && /template-injection/.test(zizmorSeed.stdout + zizmorSeed.stderr);
  if (!checks.zizmor_seed) failures.push("zizmor missed seeded security defects");
  const zizmorReal = spawnSync(zizmor.binaryPath, ["--offline", "--min-severity", "medium", "--min-confidence", "medium", "--format", "plain", root], { cwd: root, encoding: "utf8" });
  checks.zizmor_real = zizmorReal.status === 0;
  if (!checks.zizmor_real) failures.push(`zizmor real scan failed: ${zizmorReal.stdout || zizmorReal.stderr}`);

  const depRoot = join(temp, "dependency");
  mkdirSync(join(depRoot, "src", "frontend"), { recursive: true });
  mkdirSync(join(depRoot, "src", "backend"), { recursive: true });
  writeFileSync(join(depRoot, "src", "frontend", "ui.ts"), "import { secret } from '../backend/private'; export const value = secret;\n");
  writeFileSync(join(depRoot, "src", "backend", "private.ts"), "export const secret = 'private';\n");
  writeFileSync(join(depRoot, "config.mjs"), "export default { forbidden: [{ name: 'frontend-no-private-backend', severity: 'error', from: { path: '^src/frontend/' }, to: { path: '^src/backend/', dependencyTypes: ['local'] } }], options: {} };\n");
  const depBin = join(root, "node_modules", "dependency-cruiser", "bin", "dependency-cruise.mjs");
  const depSeed = spawnSync(process.execPath, [depBin, "--config", "config.mjs", "--output-type", "err-long", "--", "src/frontend/ui.ts"], { cwd: depRoot, encoding: "utf8" });
  checks.dependency_cruiser_seed = depSeed.status !== 0 && /frontend-no-private-backend/.test(depSeed.stdout + depSeed.stderr);
  if (!checks.dependency_cruiser_seed) failures.push("dependency-cruiser missed seeded boundary violation");
  const depReal = spawnSync(process.execPath, [depBin, "--config", ".dependency-cruiser.mjs", "--output-type", "err-long", "--", "src", "convex"], { cwd: root, encoding: "utf8", timeout: 120_000 });
  checks.dependency_cruiser_real = depReal.status === 0;
  if (!checks.dependency_cruiser_real) failures.push(`dependency-cruiser real scan failed: ${depReal.stdout || depReal.stderr}`);

  const playwrightCli = join(root, "node_modules", "@playwright", "test", "cli.js");
  const browserSeed = spawnSync(process.execPath, [playwrightCli, "test", "--grep", "seeded inaccessible control"], {
    cwd: root,
    encoding: "utf8",
    timeout: 120_000,
    env: { ...process.env, PLAYWRIGHT_BASE_URL: "http://127.0.0.1:1" },
  });
  checks.playwright_axe_seed = browserSeed.status === 0 && /1 passed/.test(browserSeed.stdout + browserSeed.stderr);
  if (!checks.playwright_axe_seed) failures.push(`Playwright/axe seed failed: ${browserSeed.stdout || browserSeed.stderr}`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log(JSON.stringify({ schema_version: "1.0.0", passed: failures.length === 0, candidates: Object.fromEntries(expected), checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
