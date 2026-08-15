import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { evaluatePreTool } from "../scripts/policy/core.mjs";

const root = process.cwd();
const ids = {
  agents: Array.from({ length: 11 }, (_, index) => `A${index}`),
  verifiers: Array.from({ length: 11 }, (_, index) => `V${index}`),
  specialists: Array.from({ length: 8 }, (_, index) => `S${index + 1}`),
};
const allIds = Object.values(ids).flat();

function manifest(id) {
  const directory = id.startsWith("A") ? "agents" : id.startsWith("V") ? "verifiers" : "specialists";
  return JSON.parse(readFileSync(join(root, ".agents", "manifests", directory, `${id}.json`), "utf8"));
}

function policy(agent, payload, overrides = {}) {
  return evaluatePreTool(payload, agent, overrides);
}

function runAdapter(host, agent, payload) {
  return spawnSync(process.execPath, [join(root, "scripts", "policy", "host-adapter.mjs"), "--host", host, "--event", "PreToolUse", "--agent", agent], {
    cwd: root,
    encoding: "utf8",
    input: JSON.stringify(payload),
  });
}

test("the canonical organization is complete and every role has explicit authority", () => {
  assert.equal(allIds.length, 30);
  const required = ["identity", "mission", "owns", "does_not_own", "model_tier", "execution_mode", "write_scope", "capabilities", "github", "subagents", "communication", "loop_budget", "circuit_breaker", "completion_requires", "hard_stops"];
  for (const id of allIds) {
    const value = manifest(id);
    for (const key of required) assert.ok(key in value, `${id} missing ${key}`);
    assert.deepEqual(value.capabilities.mcp.slice(0, 2), ["graphify", "context7"], `${id} must receive universal Graphify and Context7`);
    assert.ok(value.loop_budget.implementation <= 3);
    assert.ok(value.loop_budget.remediation <= 3);
    assert.ok(value.loop_budget.verifier <= 2);
    assert.ok(value.loop_budget.specialist <= 1);
  }
  assert.equal(manifest("A0").subagents.enabled, true);
  for (const id of ids.verifiers) assert.equal(manifest(id).execution_mode.read_only, true);
  for (const id of ids.specialists) {
    const value = manifest(id);
    assert.equal(value.execution_mode.read_only, true);
    assert.equal(value.subagents.enabled, false);
    assert.deepEqual(value.communication.may_message, [value.parent]);
  }
});

test("generated Codex and Antigravity profiles are exact and semantically drift-free", () => {
  const codex = readdirSync(join(root, ".codex", "agents")).filter((file) => file.endsWith(".toml")).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const antigravity = readdirSync(join(root, ".agents", "agents"), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  assert.deepEqual(codex, allIds.map((id) => `${id}.toml`).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  assert.deepEqual(antigravity, [...allIds].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));

  for (const id of allIds) {
    const codexSource = readFileSync(join(root, ".codex", "agents", `${id}.toml`), "utf8");
    const antigravitySource = readFileSync(join(root, ".agents", "agents", id, "agent.md"), "utf8");
    assert.match(codexSource, /^developer_instructions = '''/m);
    assert.match(codexSource, /^mcp_servers = \["context7","graphify"\]/m);
    assert.equal(/mainAgent: true/.test(antigravitySource), id === "A0", `${id} root flag`);
    if (manifest(id).execution_mode.read_only) {
      assert.match(codexSource, /^sandbox_mode = "read-only"/m);
      const frontmatter = antigravitySource.split("---", 3)[1];
      assert.doesNotMatch(frontmatter, /replace_file_content|write_to_file|run_command/);
    }
    assert.doesNotMatch(`${codexSource}\n${antigravitySource}`, /C:\\Users\\/i);
  }

  for (const mode of ["check", "parity"]) {
    const result = spawnSync(process.execPath, [join(root, "scripts", "agents", "host-compiler.mjs"), mode], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, `${mode}: ${result.stderr}`);
  }
});

test("generated Codex TOML parses with the standard parser", () => {
  const script = [
    "import pathlib,tomllib",
    "root=pathlib.Path(r'.codex')",
    "tomllib.loads((root/'config.toml').read_text(encoding='utf-8'))",
    "[tomllib.loads(p.read_text(encoding='utf-8')) for p in (root/'agents').glob('*.toml')]",
    "print('ok')",
  ].join(";");
  const result = spawnSync("python", ["-c", script], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ok/);
});

test("dangerous Git, protected branches, production effects, and protected eval writes are denied", () => {
  assert.equal(policy("A0", { tool_name: "Bash", tool_input: { command: "git add ." } }).code, "GIT");
  assert.equal(policy("A0", { tool_name: "Bash", tool_input: { command: "git push --force origin feature" } }).code, "GIT");
  assert.equal(policy("A2", { current_branch: "dev", tool_name: "apply_patch", tool_input: { command: "*** Begin Patch\n*** Update File: docs/decisions/x.md\n*** End Patch" } }).code, "PROTECTED_BRANCH");
  assert.equal(policy("A0", { tool_name: "apply_patch", tool_input: { command: "*** Begin Patch\n*** Update File: .env.production\n*** End Patch" } }).code, "PRODUCTION");
  assert.equal(policy("A0", { tool_name: "Bash", tool_input: { command: "npx vercel promote https://preview.example" } }).code, "PRODUCTION");
  assert.equal(policy("A0", { tool_name: "apply_patch", tool_input: { command: "*** Begin Patch\n*** Update File: .agents/evals/held-out/V10.json\n*** End Patch" } }).code, "PROTECTED_EVAL");
});

test("role write boundaries are mechanically enforced", () => {
  const write = (agent, path) => policy(agent, { tool_name: "apply_patch", tool_input: { command: `*** Begin Patch\n*** Update File: ${path}\n*** End Patch` } });
  assert.equal(write("A1", "docs/x.md").code, "SCOPE");
  assert.equal(write("A4", "convex/schema.ts").code, "SCOPE");
  assert.equal(write("A6", "src/proxy.ts").code, "SCOPE");
  assert.equal(write("A9", "src/app/page.tsx").code, "SCOPE");
  assert.equal(write("A10", "docs/release.md").code, "SCOPE");
  assert.equal(write("V5", "convex/schema.ts").code, "SCOPE");
  assert.equal(write("A4", "src/components/Button.tsx").allow, true);
  assert.equal(write("A5", "convex/schema.ts").allow, true);
  assert.equal(write("A9", "tests/lead.spec.ts").allow, true);
});

test("hub-and-spoke communication ACL is enforced", () => {
  const message = (source, target) => policy(source, { tool_name: "send_message", tool_input: { source_agent: source, target_agent: target, message: "bounded evidence" } });
  assert.equal(message("A4", "A5").code, "ACL");
  assert.equal(message("A4", "A0").allow, true);
  assert.equal(message("A4", "S3").allow, true);
  assert.equal(message("S3", "A4").allow, true);
  assert.equal(message("S3", "A3").code, "ACL");
  assert.equal(message("V4", "A4").code, "ACL");
  assert.equal(message("V4", "A0").allow, true);
});

test("Graphify-first denies broad code discovery but permits known-file reads and exact scoped fallback", () => {
  const broad = { tool_name: "Bash", tool_input: { command: "rg \"authorize\" convex --glob *.ts" } };
  assert.equal(policy("A1", broad).code, "GRAPHIFY");
  assert.equal(policy("A1", { tool_name: "Bash", tool_input: { command: "Get-Content -Raw convex/schema.ts" } }).allow, true);
  assert.equal(policy("A1", { tool_name: "Bash", tool_input: { command: "rg \"hooks\" .agents --glob *.json" } }).allow, true);
  const currentSha = "0123456789abcdef0123456789abcdef01234567";
  const exhaustionRecord = {
    graph_query: "authorization helper callers",
    failure: "Graphify omitted generated test fixture references",
    allowed_path: "convex",
    pattern: "authorize",
    expires_at: "2099-01-01T00:00:00Z",
    candidate_sha: currentSha,
  };
  assert.equal(policy("A1", broad, { exhaustionRecord, currentSha }).allow, true);
  assert.equal(policy("A1", { tool_name: "Bash", tool_input: { command: "rg \"session\" src --glob *.ts" } }, { exhaustionRecord, currentSha }).code, "GRAPHIFY");
});

test("OPEN circuits block workers and A0 can operate only when its own circuit permits", () => {
  const closed = JSON.parse(readFileSync(join(root, ".agents", "runtime", "CIRCUIT_STATE.json"), "utf8"));
  const opened = structuredClone(closed);
  opened.active_circuits.A4.state = "OPEN";
  assert.equal(policy("A4", { tool_name: "Bash", tool_input: { command: "npm test" } }, { circuitState: opened }).code, "CIRCUIT");
  assert.equal(policy("A0", { tool_name: "Bash", tool_input: { command: "git status --short" } }, { circuitState: opened }).allow, true);
});

test("both host adapters expose their native deny contracts", () => {
  const payload = { tool_name: "Bash", tool_input: { command: "git reset --hard HEAD~1" } };
  const codex = runAdapter("codex", "A0", payload);
  assert.equal(codex.status, 2);
  assert.match(codex.stderr, /DENY \[GIT\]/);
  const antigravity = runAdapter("antigravity", "A0", { toolCall: { name: "run_command", args: { CommandLine: "git reset --hard HEAD~1" } } });
  assert.equal(antigravity.status, 0);
  assert.deepEqual(JSON.parse(antigravity.stdout), { decision: "deny", reason: "DENY [GIT]: Hard reset is prohibited." });
});

test("Codex native execpolicy rules reject seeded dangerous commands", () => {
  let executable = "codex";
  let prefix = [];
  if (process.platform === "win32") {
    executable = process.execPath;
    prefix = [join(process.env.APPDATA, "npm", "node_modules", "@openai", "codex", "bin", "codex.js")];
  }
  const rules = join(root, ".codex", "rules", "sky-safety.rules");
  const result = spawnSync(executable, [...prefix, "execpolicy", "check", "--rules", rules, "--", "git", "add", "."], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /forbidden/);
});

test("universal MCP adapters are portable and Supabase is withheld", () => {
  const codex = readFileSync(join(root, ".codex", "config.toml"), "utf8");
  const antigravity = JSON.parse(readFileSync(join(root, ".agents", "mcp_config.json"), "utf8"));
  assert.match(codex, /\[mcp_servers\.graphify\]/);
  assert.match(codex, /\[mcp_servers\.context7\]/);
  assert.match(codex, /\[mcp_servers\.supabase\][\s\S]*enabled = false/);
  assert.deepEqual(Object.keys(antigravity.mcpServers).sort(), ["context7", "graphify"]);
  assert.doesNotMatch(JSON.stringify(antigravity), /C:\\Users\\/i);
});

test("host hook schemas are native and Entire provenance remains installed", () => {
  const codex = JSON.parse(readFileSync(join(root, ".codex", "hooks.json"), "utf8"));
  assert.ok(Array.isArray(codex.hooks.PreToolUse));
  assert.match(JSON.stringify(codex), /host-adapter\.mjs/);
  assert.match(JSON.stringify(codex), /entire hooks codex/);

  const antigravity = JSON.parse(readFileSync(join(root, ".agents", "hooks.json"), "utf8"));
  assert.equal(antigravity["shared-policy"].enabled, true);
  assert.ok(Array.isArray(antigravity["shared-policy"].PreToolUse));
  assert.equal("hooks" in antigravity, false, "Antigravity must not receive Codex's top-level hooks shape");

  assert.equal(JSON.parse(readFileSync(join(root, ".entire", "settings.json"), "utf8")).enabled, true);
  for (const name of ["prepare-commit-msg", "commit-msg", "post-commit", "post-rewrite", "pre-push"]) {
    assert.match(readFileSync(join(root, ".husky", name), "utf8"), /entire hooks git/);
  }
  assert.doesNotMatch(readFileSync(join(root, ".husky", "pre-push"), "utf8"), /--no-verify/);
  const installed = spawnSync("entire", ["agent", "list"], { cwd: root, encoding: "utf8" });
  assert.equal(installed.status, 0, installed.stderr);
  assert.match(installed.stdout, /✓ codex/);
  assert.match(installed.stdout, /✓ gemini/);
});
