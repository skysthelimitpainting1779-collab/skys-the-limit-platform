#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const graphPath = join(root, "graphify-out", "graph.json");
const executable = process.platform === "win32" ? "graphify.exe" : "graphify";
const argv = process.argv.slice(2);
const option = (name) => argv.includes(name) ? argv[argv.indexOf(name) + 1] : null;
const failures = [];
const checks = {};

function run(args, options = {}) {
  const result = spawnSync(executable, args, { cwd: root, encoding: "utf8", timeout: 60_000, maxBuffer: 20 * 1024 * 1024, ...options });
  if (result.status !== 0) throw new Error(`${executable} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

if (!existsSync(graphPath)) failures.push("graphify-out/graph.json is missing");
const version = run(["--version"]).trim();
if (!/^graphify 0\.9\.(?:4[3-9]|[5-9]\d)|graphify (?:[1-9]|\d{2,})\./.test(version)) failures.push(`Graphify version is below certified 0.9.43: ${version}`);

const graph = JSON.parse(readFileSync(graphPath, "utf8"));
checks.graph = { version, nodes: graph.nodes?.length ?? 0, links: graph.links?.length ?? 0, communities: new Set((graph.nodes ?? []).map((node) => node.community).filter((value) => value !== undefined)).size, built_at_commit: graph.built_at_commit };
if (checks.graph.nodes < 100 || checks.graph.links < 100 || checks.graph.communities < 2) failures.push("graph lacks useful structural data");
if (!/^[0-9a-f]{40}$/i.test(graph.built_at_commit ?? "")) failures.push("graph has no exact built_at_commit");
else {
  try { execFileSync("git", ["merge-base", "--is-ancestor", graph.built_at_commit, "HEAD"], { cwd: root, stdio: "ignore" }); }
  catch { failures.push("graph built_at_commit is not in candidate history"); }
  const sourceDrift = execFileSync("git", ["diff", "--name-only", `${graph.built_at_commit}...HEAD`, "--", ".", ":!graphify-out/**"], { cwd: root, encoding: "utf8" }).trim();
  checks.graph.tracked_source_paths_since_build_marker = sourceDrift ? sourceDrift.split(/\r?\n/).length : 0;
}

try {
  const query = run(["query", "evaluatePreTool affected tests", "--budget", "250"]);
  const explain = run(["explain", "evaluatePreTool"]);
  const affected = run(["affected", "evaluatePreTool", "--depth", "3"]);
  const path = run(["path", "evaluatePreTool()", "policy()", "--undirected"]);
  const gods = JSON.parse(run(["god-nodes", "--top", "5", "--json"]));
  const freshness = run(["check-update", "."]);
  checks.traversal = {
    query: /scripts\/policy\/core\.mjs|scripts\\policy\\core\.mjs/.test(query),
    explain: /host-adapter\.mjs/.test(explain) && /agent-team\.test\.mjs/.test(explain),
    affected: /host-adapter\.mjs/.test(affected) && /agent-team\.test\.mjs/.test(affected),
    path: /Shortest path \(1 hops\)/.test(path),
    god_nodes: Array.isArray(gods) && gods.length === 5,
    freshness_check: !/needs[_ -]?update|stale|rebuild required/i.test(freshness),
  };
  for (const [name, passed] of Object.entries(checks.traversal)) if (!passed) failures.push(`Graphify ${name} check failed`);
} catch (error) { failures.push(error.message); }

const memoryDir = mkdtempSync(join(tmpdir(), "sky-graphify-memory-"));
try {
  run(["save-result", "--question", "Where is policy enforced?", "--answer", "evaluatePreTool in scripts/policy/core.mjs", "--type", "query", "--nodes", "evaluatePreTool()", "--outcome", "useful", "--memory-dir", memoryDir]);
  const lessons = join(memoryDir, "LESSONS.md");
  run(["reflect", "--memory-dir", memoryDir, "--out", lessons, "--graph", graphPath]);
  checks.memory_reflection = existsSync(lessons) && /evaluatePreTool|policy/i.test(readFileSync(lessons, "utf8"));
  if (!checks.memory_reflection) failures.push("Graphify work memory/reflection did not preserve the useful result");
} finally { rmSync(memoryDir, { recursive: true, force: true }); }

const secondary = option("--secondary");
if (secondary) {
  const secondaryPath = resolve(secondary);
  if (!existsSync(secondaryPath)) failures.push(`secondary graph missing: ${secondaryPath}`);
  else {
    const mergeDir = mkdtempSync(join(tmpdir(), "sky-graphify-merge-"));
    try {
      const mergedPath = join(mergeDir, "merged.json");
      run(["merge-graphs", graphPath, secondaryPath, "--out", mergedPath]);
      const merged = JSON.parse(readFileSync(mergedPath, "utf8"));
      const repos = [...new Set((merged.nodes ?? []).map((node) => node.repo_tag ?? node.repo).filter(Boolean))];
      const output = run(["query", "Compare Convex WorkOS with Supabase Payload Directus Express", "--graph", mergedPath, "--budget", "300"]);
      checks.cross_repo = { status: repos.length >= 2 && /Convex|Supabase|Payload|Directus|Express/i.test(output) ? "PASS" : "FAIL", repositories: repos.length, nodes: merged.nodes?.length ?? 0 };
      if (checks.cross_repo.status !== "PASS") failures.push("cross-repository merge/query failed");
    } finally { rmSync(mergeDir, { recursive: true, force: true }); }
  }
} else checks.cross_repo = { status: "NOT_RUN", reason: "Pass --secondary <graph.json> for local cross-repository certification." };

const worktrees = execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
checks.worktree_local = worktrees.replaceAll("\\", "/").toLowerCase().includes(root.replaceAll("\\", "/").toLowerCase());
if (!checks.worktree_local) failures.push("current isolated worktree is absent from git worktree inventory");

const report = { schema_version: "1.0.0", passed: failures.length === 0, checks, failures };
if (option("--out")) {
  const output = resolve(option("--out"));
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
