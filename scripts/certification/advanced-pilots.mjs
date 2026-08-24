#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { runTool } from "../oss/toolchain.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const scorecard = read(".agents/evidence/oss/advanced.json");
const rubric = read(".agents/reuse/candidate-rubric.json");
const packageJson = read("package.json");
const tools = read(".agents/tools/oss-tools.json");
const failures = [];
const checks = {};
const expected = new Map([
  ["Knip", "DEFER"],
  ["fast-check", "ADOPT"],
  ["StrykerJS", "ADOPT"],
  ["ast-grep", "ADOPT"],
  ["Semgrep Community", "ADOPT"],
  ["Lighthouse CI", "REJECT"],
  ["OSV-Scanner", "ADOPT"],
  ["Gitleaks", "ADOPT"],
  ["k6", "ADOPT"],
  ["schema-dts", "DEFER"],
  ["lychee", "ADOPT"],
]);

for (const candidate of scorecard.candidates) {
  if (expected.get(candidate.name) !== candidate.decision) failures.push(`${candidate.name} decision drift`);
  if ("numeric_score" in candidate || "total_score" in candidate) failures.push(`${candidate.name} uses prohibited aggregate score`);
  if (!candidate.pilot?.seeded_defect || typeof candidate.pilot.detected !== "boolean") failures.push(`${candidate.name} lacks seeded pilot evidence`);
  for (const [section, fields] of Object.entries(rubric.sections)) {
    for (const field of fields) {
      if (!(field in (candidate.assessment?.[section] ?? {}))) failures.push(`${candidate.name} missing ${section}.${field}`);
    }
  }
}
if (scorecard.candidates.length !== expected.size) failures.push("advanced candidate inventory drift");

for (const [name, version] of [
  ["fast-check", "4.9.0"],
  ["@stryker-mutator/core", "10.0.0"],
  ["@stryker-mutator/vitest-runner", "10.0.0"],
  ["@ast-grep/cli", "0.45.1"],
]) {
  if (packageJson.devDependencies?.[name] !== version) failures.push(`${name} is not pinned to ${version}`);
}
for (const rejected of ["knip", "@lhci/cli", "schema-dts"]) {
  if (packageJson.devDependencies?.[rejected] || packageJson.dependencies?.[rejected]) failures.push(`${rejected} should not be installed`);
}
if (packageJson.overrides?.qs !== "6.15.3") failures.push("Stryker qs security override drift");
if (packageJson.allowScripts?.["@ast-grep/cli@0.45.1"] !== false) failures.push("ast-grep install script decision drift");
for (const [name, version] of [["osv-scanner", "2.5.0"], ["gitleaks", "8.30.1"], ["k6", "2.2.0"], ["lychee", "0.24.2"]]) {
  if (tools.tools[name]?.version !== version) failures.push(`${name} binary pin drift`);
}
for (const path of [".semgrep.yml", "stryker.pilot.config.mjs", "scripts/oss/k6-local.mjs", "tests/load/estimate-validation.js"]) {
  if (!existsSync(join(root, path))) failures.push(`${path} is missing`);
}

const vitest = spawnSync(
  process.execPath,
  [join(root, "node_modules", "vitest", "vitest.mjs"), "run", "src/__tests__/lead-intake-proof.property.test.ts"],
  { cwd: root, encoding: "utf8", timeout: 60_000 },
);
checks.fast_check_properties = vitest.status === 0 && /2 passed/.test(vitest.stdout + vitest.stderr);
if (!checks.fast_check_properties) failures.push(`fast-check property pilot failed: ${vitest.stdout || vitest.stderr}`);

const temp = mkdtempSync(join(tmpdir(), "sky-advanced-oss-"));
try {
  const astSeed = join(temp, "ast-seed.ts");
  writeFileSync(astSeed, "export const normalized = candidate ?? null;\n");
  const ast = spawnSync(
    process.execPath,
    [join(root, "node_modules", "@ast-grep", "cli", "ast-grep"), "--pattern", "$A ?? null", "--lang", "ts", "--json", astSeed],
    { cwd: root, encoding: "utf8", timeout: 30_000 },
  );
  let astMatches = [];
  try { astMatches = JSON.parse(ast.stdout); } catch {}
  checks.ast_grep_seed = ast.status === 0 && astMatches.length === 1;
  if (!checks.ast_grep_seed) failures.push(`ast-grep missed structural seed: ${ast.stdout || ast.stderr}`);

  const semgrepExecutable = process.platform === "win32" ? "uvx.exe" : "uvx";
  const semgrep = spawnSync(
    semgrepExecutable,
    ["--from", "semgrep==1.173.0", "semgrep", "scan", "--metrics=off", "--json", "--error", "--config", ".semgrep.yml", ".agents/evals/fixtures/oss/semgrep/caller-controlled-identity.ts"],
    { cwd: root, encoding: "utf8", timeout: 120_000, maxBuffer: 20 * 1024 * 1024 },
  );
  let semgrepOutput = {};
  try { semgrepOutput = JSON.parse(semgrep.stdout); } catch {}
  checks.semgrep_seed = semgrep.status === 1 && semgrepOutput.results?.length === 2 && semgrepOutput.errors?.length === 0;
  if (!checks.semgrep_seed) failures.push(`Semgrep missed caller-controlled identity seed: ${semgrep.stdout || semgrep.stderr}`);

  const osv = await runTool("osv-scanner", ["scan", "-L", ".agents/evals/fixtures/oss/osv/package-lock.json", "--format", "json"], { cwd: root });
  let osvOutput = {};
  try { osvOutput = JSON.parse(osv.stdout); } catch {}
  const osvGroups = osvOutput.results?.flatMap((result) => result.packages ?? []).flatMap((entry) => entry.groups ?? []) ?? [];
  checks.osv_seed = osv.status === 1 && osvGroups.length >= 3;
  if (!checks.osv_seed) failures.push(`OSV-Scanner missed vulnerable lockfile seed: ${osv.stdout || osv.stderr}`);

  const gitleaksCanary = `OPENAI_API_KEY=sk-proj-${"A7b9C2d4E6f8G1h3J5k7L9m2N4p6Q8r1".repeat(2)}\n`;
  const gitleaks = await runTool(
    "gitleaks",
    ["stdin", "--no-banner", "--no-color", "--redact=100", "--report-format", "json", "--report-path=-"],
    { cwd: root, input: gitleaksCanary },
  );
  checks.gitleaks_seed = gitleaks.status === 1 && /generic-api-key/.test(gitleaks.stdout) && !gitleaks.stdout.includes(gitleaksCanary.trim());
  if (!checks.gitleaks_seed) failures.push(`Gitleaks missed or exposed the synthetic canary: ${gitleaks.stdout || gitleaks.stderr}`);

  const k6 = await runTool("k6", ["run", "--quiet", "tests/load/estimate-validation.js"], {
    cwd: root,
    env: { ...process.env, BASE_URL: "https://example.com" },
  });
  checks.k6_external_denial = k6.status !== 0 && /restricted to a local server/.test(k6.stderr + k6.stdout);
  if (!checks.k6_external_denial) failures.push("k6 load script did not deny an external target");

  const lychee = await runTool(
    "lychee",
    ["--offline", "--no-progress", "--mode", "plain", ".agents/evals/fixtures/oss/lychee/broken-local-link.md"],
    { cwd: root },
  );
  checks.lychee_seed = lychee.status === 2 && /does-not-exist\.md/.test(lychee.stdout + lychee.stderr);
  if (!checks.lychee_seed) failures.push("lychee missed broken local-link seed");
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log(JSON.stringify({ schema_version: "1.0.0", passed: failures.length === 0, candidates: Object.fromEntries(expected), checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
