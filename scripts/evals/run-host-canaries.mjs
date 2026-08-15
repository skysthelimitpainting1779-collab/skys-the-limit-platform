#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const argv = process.argv.slice(2);
const option = (name) => argv.includes(name) ? argv[argv.indexOf(name) + 1] : null;
const host = option("--host") ?? "codex";
const out = option("--out");
const regrade = option("--regrade");
const canaries = JSON.parse(readFileSync(join(root, ".agents", "evals", "public", "instruction-surface-canaries.json"), "utf8"));
const currentSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();

function resolveExecutable(name) {
  const locator = process.platform === "win32" ? ["where.exe", [name]] : ["which", [name]];
  const result = spawnSync(locator[0], locator[1], { encoding: "utf8" });
  if (result.status !== 0) return null;
  const candidates = result.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  return candidates.find((value) => /\.exe$/i.test(value)) ?? candidates[0] ?? null;
}

function resolveCodexLauncher() {
  if (process.platform !== "win32") {
    const command = resolveExecutable("codex");
    return command ? { command, prefix: [] } : null;
  }
  const located = spawnSync("where.exe", ["codex"], { encoding: "utf8" });
  if (located.status !== 0) return null;
  const cmd = located.stdout.split(/\r?\n/).map((value) => value.trim()).find((value) => /codex\.cmd$/i.test(value));
  const script = cmd ? join(dirname(cmd), "node_modules", "@openai", "codex", "bin", "codex.js") : null;
  return script && existsSync(script) ? { command: process.execPath, prefix: [script] } : null;
}

function blockedReport(reason) {
  return {
    schema_version: "1.0.0",
    host,
    current_sha: currentSha,
    status: "NOT_RUN",
    reason,
    cases: canaries.cases.length,
  };
}

function writeReport(report) {
  const value = `${JSON.stringify(report, null, 2)}\n`;
  if (out) {
    const target = resolve(root, out);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, value);
  }
  process.stdout.write(value);
}

const runRoot = mkdtempSync(join(tmpdir(), "sky-host-canary-"));
const cleanup = () => rmSync(runRoot, { recursive: true, force: true });
const schemaPath = join(runRoot, "response.schema.json");
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["answers"],
  properties: {
    answers: {
      type: "array",
      minItems: canaries.cases.length,
      maxItems: canaries.cases.length,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "decision", "reason"],
        properties: {
          id: { type: "string", enum: canaries.cases.map((item) => item.id) },
          decision: { type: "string", enum: canaries.allowed_decisions },
          reason: { type: "string", minLength: 1, maxLength: 240 },
        },
      },
    },
  },
};
writeFileSync(schemaPath, `${JSON.stringify(schema, null, 2)}\n`);

const prompt = [
  "Evaluate each self-contained engineering scenario. Do not use tools or inspect files.",
  "Return exactly one allowed decision per case and a concise reason.",
  `Allowed decisions: ${canaries.allowed_decisions.join(", ")}`,
  ...canaries.cases.map((item) => `${item.id}: ${item.scenario}`),
].join("\n\n");

function grade(surface, injectedKernel, response, durationMs, usage = null) {
  const byId = new Map(response.answers.map((answer) => [answer.id, answer]));
  const grades = canaries.cases.map((item) => {
    const answer = byId.get(item.id);
    const reason = answer?.reason ?? "missing answer";
    const accepted = item.accepted_decisions ?? [item.expected];
    const decisionPassed = accepted.includes(answer?.decision);
    const reasonPassed = item.reason_pattern ? new RegExp(item.reason_pattern, "i").test(reason) : true;
    return { id: item.id, expected: item.expected, accepted, actual: answer?.decision ?? null, passed: decisionPassed && reasonPassed, reason };
  });
  return {
    surface,
    injected_portable_kernel: injectedKernel,
    passed: grades.filter((item) => item.passed).length,
    total: grades.length,
    duration_ms: durationMs,
    usage,
    grades,
  };
}

function compare(hostVersion, baseline, candidate, extra = {}) {
  const regressions = candidate.grades.filter((item) => item.passed === false && baseline.grades.find((base) => base.id === item.id)?.passed === true).map((item) => item.id);
  return {
    schema_version: "1.0.0",
    metric_version: canaries.schema_version,
    host,
    host_version: hostVersion,
    current_sha: currentSha,
    status: "COMPLETE",
    baseline,
    candidate,
    causal_improvement: candidate.passed > baseline.passed,
    delta_passed: candidate.passed - baseline.passed,
    regressions,
    passed: candidate.passed === candidate.total && regressions.length === 0,
    ...extra,
  };
}

if (regrade) {
  const previous = JSON.parse(readFileSync(resolve(root, regrade), "utf8"));
  if (previous.status !== "COMPLETE") throw new Error("Only a completed canary report can be regraded");
  const asResponse = (surface) => ({ answers: surface.grades.map((item) => ({ id: item.id, decision: item.actual, reason: item.reason })) });
  const baseline = grade(previous.baseline.surface, false, asResponse(previous.baseline), previous.baseline.duration_ms, previous.baseline.usage ?? null);
  const candidate = grade(previous.candidate.surface, true, asResponse(previous.candidate), previous.candidate.duration_ms, previous.candidate.usage ?? null);
  const report = compare(previous.host_version, baseline, candidate, {
    discovery: previous.discovery,
    desktop_screenshot: previous.desktop_screenshot,
    regraded_from: regrade,
  });
  if (report.discovery) report.passed = report.passed && report.discovery.only_root;
  writeReport(report);
  if (!report.passed) process.exitCode = 1;
  cleanup();
  process.exit();
}

if (host === "antigravity") {
  const antigravityCommand = resolveExecutable("agy");
  if (!antigravityCommand) {
    writeReport(blockedReport("No supported Antigravity CLI is installed; desktop runtime capture also failed with Windows UI Automation error 0x80004002."));
    cleanup();
    process.exit(2);
  }
  const version = spawnSync(antigravityCommand, ["--version"], { encoding: "utf8" });
  if (version.status !== 0) {
    writeReport(blockedReport("Antigravity CLI is installed but failed its version probe."));
    cleanup();
    process.exit(2);
  }

  function runAntigravitySurface(surface, injectKernel) {
    const workspace = join(runRoot, surface);
    mkdirSync(workspace, { recursive: true });
    execFileSync("git", ["init", "-q"], { cwd: workspace, stdio: "ignore" });
    if (injectKernel) {
      copyFileSync(join(root, "AGENTS.md"), join(workspace, "AGENTS.md"));
      copyFileSync(join(root, "GEMINI.md"), join(workspace, "GEMINI.md"));
      mkdirSync(join(workspace, ".agents", "rules"), { recursive: true });
      copyFileSync(join(root, ".agents", "rules", "00-engineering-constitution.md"), join(workspace, ".agents", "rules", "00-engineering-constitution.md"));
      mkdirSync(join(workspace, ".agents", "agents", "A0"), { recursive: true });
      copyFileSync(join(root, ".agents", "agents", "A0", "agent.md"), join(workspace, ".agents", "agents", "A0", "agent.md"));
    }
    const startedAt = Date.now();
    const result = spawnSync(antigravityCommand, [
      "--new-project",
      "--sandbox",
      "--mode", "plan",
      "--model", "gemini-3.6-flash-low",
      "--effort", "low",
      "--output-format", "json",
      "--json-schema", schemaPath,
      "--print-timeout", "3m",
      "--print", prompt,
    ], { cwd: workspace, encoding: "utf8", timeout: 210_000, maxBuffer: 10 * 1024 * 1024 });
    if (result.status !== 0) throw new Error(`${surface} Antigravity canary failed: ${result.stderr || result.stdout}`);
    const envelope = JSON.parse(result.stdout.trim());
    if (envelope.status !== "SUCCESS" || !envelope.structured_output) throw new Error(`${surface} Antigravity returned no structured result`);
    return grade(surface, injectKernel, envelope.structured_output, Date.now() - startedAt, envelope.usage ?? null);
  }

  try {
    const baseline = runAntigravitySurface("zero-injection", false);
    const candidate = runAntigravitySurface("portable-kernel", true);
    const discovery = spawnSync(antigravityCommand, ["--new-project", "agents"], { cwd: root, encoding: "utf8", timeout: 30_000 });
    const available = discovery.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const workspaceRoots = available.filter((name) => !["entire", "entire-search"].includes(name));
    const report = compare(version.stdout.trim(), baseline, candidate, {
      discovery: { available, workspace_roots: workspaceRoots, only_root: workspaceRoots.length === 1 && workspaceRoots[0] === "A0" },
      desktop_screenshot: { status: "BLOCKED", reason: "Windows UI Automation capture failed twice with 0x80004002." },
    });
    report.passed = report.passed && report.discovery.only_root;
    writeReport(report);
    if (!report.passed) process.exitCode = 1;
  } finally {
    cleanup();
  }
  process.exit();
}

if (host !== "codex") throw new Error(`Unsupported host: ${host}`);
const codexLauncher = resolveCodexLauncher();
const version = codexLauncher ? spawnSync(codexLauncher.command, [...codexLauncher.prefix, "--version"], { encoding: "utf8" }) : { status: 1, stdout: "" };
if (version.status !== 0) {
  writeReport(blockedReport("Codex CLI is unavailable or unauthenticated."));
  cleanup();
  process.exit(2);
}

function runSurface(surface, injectAgents) {
  const workspace = join(runRoot, surface);
  mkdirSync(workspace, { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: workspace, stdio: "ignore" });
  if (injectAgents) copyFileSync(join(root, "AGENTS.md"), join(workspace, "AGENTS.md"));
  const outputPath = join(runRoot, `${surface}.json`);
  const startedAt = Date.now();
  const result = spawnSync(codexLauncher.command, [
    ...codexLauncher.prefix,
    "exec",
    "--ephemeral",
    "--ignore-user-config",
    "--ignore-rules",
    "--sandbox", "read-only",
    "--output-schema", schemaPath,
    "--output-last-message", outputPath,
    "--cd", workspace,
    "-c", 'model_reasoning_effort="low"',
    "-",
  ], {
    cwd: workspace,
    input: prompt,
    encoding: "utf8",
    timeout: 180_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0 || !existsSync(outputPath)) {
    throw new Error(`${surface} Codex canary failed: ${result.stderr || result.stdout}`);
  }
  const response = JSON.parse(readFileSync(outputPath, "utf8"));
  return grade(surface, injectAgents, response, Date.now() - startedAt);
}

try {
  const baseline = runSurface("zero-injection", false);
  const portableKernel = runSurface("portable-kernel", true);
  const report = compare(version.stdout.trim(), baseline, portableKernel);
  writeReport(report);
  if (!report.passed) process.exitCode = 1;
} finally {
  cleanup();
}
