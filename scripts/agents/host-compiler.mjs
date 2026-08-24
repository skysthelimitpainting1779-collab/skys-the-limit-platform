#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = process.cwd();
const mode = process.argv[2] ?? "compile";
const manifestRoot = join(root, ".agents", "manifests");
const modelMap = readJson(join(root, ".agents", "host-models.json"));
const capabilityMap = readJson(join(root, ".agents", "host-capabilities.json"));
const runtimeStatus = readJson(join(root, ".agents", "hosts", "runtime-status.json"));

const expectedTopLevelKeys = [
  "schema_version", "kind", "identity", "mission", "owns", "does_not_own",
  "model_tier", "execution_mode", "write_scope", "capabilities", "github",
  "subagents", "communication", "loop_budget", "circuit_breaker",
  "completion_requires", "hard_stops",
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function stableJson(value, spacing = 2) {
  return JSON.stringify(stable(value), null, spacing);
}

function sha(value) {
  return createHash("sha256").update(value).digest("hex");
}

function listManifests(kind) {
  const dir = join(manifestRoot, kind);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => ({ path: join(dir, file), manifest: readJson(join(dir, file)) }));
}

function validateModelMap() {
  const ageMs = Date.now() - Date.parse(`${modelMap.verified_on}T00:00:00Z`);
  if (!Number.isFinite(ageMs) || ageMs > modelMap.maximum_age_days * 86_400_000) {
    throw new Error(`Host model mapping is stale: ${modelMap.verified_on}`);
  }
  for (const host of ["codex", "antigravity"]) {
    for (const tier of ["FLAGSHIP", "BALANCED", "EFFICIENT"]) {
      const id = modelMap[host]?.tiers?.[tier];
      if (!modelMap[host]?.allowed?.includes(id)) {
        throw new Error(`${host} tier ${tier} maps to unsupported identifier ${id}`);
      }
    }
  }
}

function capabilityBase(capability) {
  const withoutQualifier = capability.split(":")[0];
  for (const key of Object.keys(capabilityMap.mappings).sort((a, b) => b.length - a.length)) {
    if (withoutQualifier === key || withoutQualifier.startsWith(`${key}-`)) return key;
  }
  return null;
}

function validateManifest(entry, expectedKind) {
  const m = entry.manifest;
  const allowedKeys = new Set([...expectedTopLevelKeys, ...(expectedKind === "specialists" ? ["parent", "parents"] : [])]);
  for (const key of Object.keys(m)) {
    if (!allowedKeys.has(key)) throw new Error(`${relative(root, entry.path)} has unsupported key ${key}`);
  }
  for (const key of expectedTopLevelKeys) {
    if (!(key in m)) throw new Error(`${relative(root, entry.path)} is missing ${key}`);
  }
  const expectedKindValue = expectedKind === "agents" ? "standing_agent" : expectedKind.slice(0, -1);
  if (m.kind !== expectedKindValue) throw new Error(`${m.identity?.id} has kind ${m.kind}, expected ${expectedKindValue}`);
  if (!/^(?:[AVS](?:[0-9]|10)|R0)$/.test(m.identity?.id ?? "")) throw new Error(`Invalid identity in ${entry.path}`);
  if (m.execution_mode.read_only === m.execution_mode.may_write) throw new Error(`${m.identity.id} read/write mode is contradictory`);
  if (m.execution_mode.read_only && m.write_scope.allow.length) throw new Error(`${m.identity.id} is read-only but has allowed write paths`);
  if (m.execution_mode.read_only && !m.write_scope.deny.includes("**/*")) throw new Error(`${m.identity.id} read-only scope must deny **/*`);
  for (const skill of m.capabilities.skills) {
    if (!existsSync(join(root, ".agents", "skills", skill, "SKILL.md"))) throw new Error(`${m.identity.id} references missing skill ${skill}`);
  }
  for (const capability of m.capabilities.mcp) {
    const base = capabilityBase(capability);
    if (!base) throw new Error(`${m.identity.id} has no host mapping for MCP capability ${capability}`);
  }
  if (m.loop_budget.implementation > 3 || m.loop_budget.remediation > 3 || m.loop_budget.verifier > 2 || m.loop_budget.specialist > 1) {
    throw new Error(`${m.identity.id} exceeds bounded loop limits`);
  }
  if (m.identity.id !== entry.path.split(/[\\/]/).at(-1).replace(/\.json$/, "")) throw new Error(`${entry.path} filename and identity differ`);
}

function loadOrganization() {
  validateModelMap();
  const groups = {
    agents: listManifests("agents"),
    verifiers: listManifests("verifiers"),
    specialists: listManifests("specialists"),
  };
  for (const [kind, entries] of Object.entries(groups)) for (const entry of entries) validateManifest(entry, kind);

  const agents = groups.agents.map((entry) => entry.manifest);
  const verifiers = groups.verifiers.map((entry) => entry.manifest);
  const specialists = groups.specialists.map((entry) => entry.manifest);
  const ids = (prefix, count, start = 0) => Array.from({ length: count }, (_, index) => `${prefix}${index + start}`);
  const assertIds = (label, actual, expected) => {
    if (stableJson(actual.sort()) !== stableJson(expected.sort())) throw new Error(`${label} IDs are incomplete: ${actual.join(", ")}`);
  };
  assertIds("standing agent", agents.map((m) => m.identity.id), ids("A", 11));
  assertIds("verifier", verifiers.map((m) => m.identity.id), ids("V", 11));
  assertIds("specialist", specialists.map((m) => m.identity.id), ["R0", ...ids("S", 8, 1)]);
  if (!agents.find((m) => m.identity.id === "A0")?.subagents.enabled) throw new Error("Only A0 root must be able to dispatch standing agents");
  for (const agent of agents.filter((m) => m.identity.id !== "A0")) {
    if (agent.communication.may_message.some((id) => /^A(?:[1-9]|10)$/.test(id) && id !== "A0")) throw new Error(`${agent.identity.id} has a worker-to-worker ACL`);
    if (agent.subagents.verifier !== `V${agent.identity.id.slice(1)}`) throw new Error(`${agent.identity.id} has the wrong verifier`);
  }
  for (const specialist of specialists) {
    const parents = specialist.parents ?? [specialist.parent];
    if (!parents.length || stableJson([...specialist.communication.may_message].sort(), 0) !== stableJson([...parents].sort(), 0)) throw new Error(`${specialist.identity.id} is not sponsor-scoped`);
    for (const parentId of parents) {
      const parent = agents.find((m) => m.identity.id === parentId);
      if (!parent?.subagents.specialists.includes(specialist.identity.id)) throw new Error(`${specialist.identity.id} is not registered by ${parentId}`);
    }
  }
  return [...agents, ...verifiers, ...specialists];
}

function semanticContract(manifest) {
  return stable(manifest);
}

function codexMcpServers(manifest) {
  const servers = new Set(["graphify", "context7"]);
  for (const capability of manifest.capabilities.mcp) {
    const base = capabilityBase(capability);
    const mapping = capabilityMap.mappings[base];
    if (mapping.mode === "workspace_mcp") servers.add(mapping.server);
  }
  return [...servers].sort();
}

function renderCodex(manifest) {
  const id = manifest.identity.id;
  const tier = manifest.model_tier.primary;
  const contract = stableJson(semanticContract(manifest));
  const instructions = [
    `You are ${id}: ${manifest.identity.name}.`,
    "Root AGENTS.md is the portable constitution and overrides this adapter.",
    id === "A0" ? "You are the only root orchestrator and must not be spawned as a child." : "You are bounded by A0 dispatch and the semantic contract below.",
    manifest.kind === "verifier" ? "Start from clean context. Accept no parent conversation or reasoning. Return PASS, FAIL, or UNCERTAIN and never repair findings." : "Use Graphify before structural discovery and Context7 only when current external behavior materially affects correctness.",
    "BEGIN SEMANTIC CONTRACT",
    contract,
    "END SEMANTIC CONTRACT",
  ].join("\n\n");
  return `# GENERATED by npm run host:compile; edit .agents/manifests/${manifest.kind === "standing_agent" ? "agents" : `${manifest.kind}s`}/${id}.json\nname = ${JSON.stringify(id)}\ndescription = ${JSON.stringify(`${manifest.identity.role}: ${manifest.mission}`)}\nmodel = ${JSON.stringify(modelMap.codex.tiers[tier])}\nmodel_reasoning_effort = ${JSON.stringify(modelMap.codex.reasoning[tier])}\nsandbox_mode = ${JSON.stringify(manifest.execution_mode.read_only ? "read-only" : "workspace-write")}\nmcp_servers = ${JSON.stringify(codexMcpServers(manifest))}\ndeveloper_instructions = '''\n${instructions}\n'''\n`;
}

function antigravityTools(manifest) {
  const tools = new Set(["view_file"]);
  if (!manifest.execution_mode.read_only && manifest.capabilities.tools.some((tool) => tool.includes("command") || tool === "git" || tool === "git-read" || tool === "git-worktree")) tools.add("run_command");
  if (manifest.execution_mode.may_write) {
    tools.add("replace_file_content");
    tools.add("write_to_file");
  }
  if (manifest.identity.id === "A0") {
    for (const tool of ["invoke_subagent", "send_message", "manage_subagents", "manage_task"]) tools.add(tool);
  } else if (manifest.kind === "standing_agent") {
    tools.add("send_message");
    if (manifest.subagents.enabled) tools.add("invoke_subagent");
  } else if (manifest.kind === "specialist") {
    tools.add("send_message");
  }
  return [...tools].sort();
}

function yamlList(values, indent = "  ") {
  return values.length ? values.map((value) => `${indent}- ${JSON.stringify(value)}`).join("\n") : `${indent}[]`;
}

function renderAntigravity(manifest) {
  const id = manifest.identity.id;
  const tier = manifest.model_tier.primary;
  const contract = stableJson(semanticContract(manifest));
  return `---\nname: ${id}\ndescription: ${JSON.stringify(`${manifest.identity.role}: ${manifest.mission}`)}\ntools:\n${yamlList(antigravityTools(manifest))}\nmainAgent: ${id === "A0"}\nsubagent: ${id !== "A0"}\nmodel: ${modelMap.antigravity.tiers[tier]}\ncommandExecutionPolicy: sandbox\nskills:\n${yamlList(manifest.capabilities.skills.map((skill) => `skills/${skill}`))}\n---\n\n# ${manifest.identity.name} (${id})\n\nRoot \`AGENTS.md\` is the portable constitution and overrides this generated adapter.\n\n${manifest.kind === "verifier" ? "Start from clean context. Accept no parent conversation or reasoning. Return only PASS, FAIL, or UNCERTAIN with evidence. Never repair findings." : manifest.mission}\n\n## Semantic contract\n\nBEGIN SEMANTIC CONTRACT\n\n\`\`\`json\n${contract}\n\`\`\`\n\nEND SEMANTIC CONTRACT\n`;
}

function renderCodexConfig() {
  return `#:schema https://developers.openai.com/codex/config-schema.json\n# GENERATED by npm run host:compile; project-local additive baseline.\n\n[features]\nhooks = true\nmulti_agent = true\n\n[agents]\nmax_concurrent_threads_per_session = 3\n\n[mcp_servers.graphify]\ncommand = "graphify-mcp"\nargs = ["--graph", "graphify-out/graph.json"]\nrequired = true\nstartup_timeout_sec = 20\ntool_timeout_sec = 60\n\n[mcp_servers.context7]\ncommand = "npx"\nargs = ["-y", "@upstash/context7-mcp@4.0.2"]\nrequired = true\nstartup_timeout_sec = 30\ntool_timeout_sec = 60\n\n[mcp_servers.supabase]\nenabled = false\n`;
}

function renderCodexHooks() {
  const base = `node \"$(git rev-parse --show-toplevel)/scripts/policy/host-adapter.mjs\" --host codex`;
  const windows = (event) => `powershell -NoProfile -Command \"$r=(git rev-parse --show-toplevel); node (Join-Path $r 'scripts/policy/host-adapter.mjs') --host codex --event ${event}\"`;
  const handler = (event, statusMessage) => ({ type: "command", command: `${base} --event ${event}`, commandWindows: windows(event), timeout: 10, statusMessage });
  const entire = (event, missingMessage = false) => ({
    type: "command",
    command: `sh -c 'if ! command -v entire >/dev/null 2>&1; then ${missingMessage ? "printf \"%s\\n\" \"{\\\"systemMessage\\\":\\\"Entire CLI is enabled but not installed or not on PATH. Installation guide: https://docs.entire.io/cli/installation#installation-methods\\\"}\"; " : ""}exit 0; fi; exec entire hooks codex ${event}'`,
    timeout: 30,
  });
  return JSON.stringify({
    description: "Generated portable policy and Entire provenance hooks.",
    hooks: {
      SessionStart: [{ hooks: [entire("session-start", true)] }],
      UserPromptSubmit: [{ hooks: [entire("user-prompt-submit")] }],
      PreToolUse: [{ matcher: "Bash|shell_command|apply_patch|write_file|send_message|spawn_agent", hooks: [handler("PreToolUse", "Checking repository policy")] }],
      PostToolUse: [{ matcher: "*", hooks: [entire("post-tool-use")] }],
      Stop: [{ hooks: [entire("stop")] }],
    },
  }, null, 2) + "\n";
}

function renderAntigravityHooks() {
  const command = (event) => `node \"$(git rev-parse --show-toplevel)/scripts/policy/host-adapter.mjs\" --host antigravity --event ${event}`;
  return JSON.stringify({
    "shared-policy": {
      enabled: true,
      PreToolUse: [{ matcher: "run_command|replace_file_content|write_to_file|grep_search|find_by_name|send_message|invoke_subagent", hooks: [{ type: "command", command: command("PreToolUse"), timeout: 10 }] }],
    },
  }, null, 2) + "\n";
}

function renderMcpConfig() {
  return JSON.stringify({ mcpServers: {
    graphify: { command: "graphify-mcp", args: ["--graph", "graphify-out/graph.json"], cwd: "." },
    context7: { command: "npx", args: ["-y", "@upstash/context7-mcp@4.0.2"], cwd: "." },
  } }, null, 2) + "\n";
}

function renderCodexRules() {
  const rules = [
    [["git", "add", "."], "Stage explicit files instead of git add ."],
    [["git", "add", "-A"], "Stage explicit files instead of git add -A"],
    [["git", "commit", "-a"], "Stage explicit files before committing"],
    [["git", "reset", "--hard"], "Use a scoped, recoverable change instead of hard reset"],
    [["git", "clean", "-fd"], "Do not destructively clean the worktree"],
    [["git", "push", "--force"], "Force-push is prohibited"],
    [["git", "push", "-f"], "Force-push is prohibited"],
  ];
  return `# GENERATED by npm run host:compile\n${rules.map(([pattern, justification]) => `\nprefix_rule(\n    pattern = ${JSON.stringify(pattern)},\n    decision = "forbidden",\n    justification = ${JSON.stringify(justification)},\n    match = [${JSON.stringify(pattern.join(" "))}],\n)\n`).join("")}`;
}

function renderAntigravityRule() {
  return `---\ntrigger: always_on\ndescription: Load the portable engineering constitution.\n---\n\n# Cross-host engineering constitution\n\nRead and obey \`@../../AGENTS.md\`. Host adapters may narrow permissions but may not weaken it. Semantic role authority lives in \`@../manifests/\`.\n`;
}

function expectedOutputs(manifests) {
  const outputs = new Map();
  for (const manifest of manifests) {
    const id = manifest.identity.id;
    outputs.set(join(root, ".codex", "agents", `${id}.toml`), renderCodex(manifest));
    outputs.set(join(root, ".agents", "agents", id, "agent.md"), renderAntigravity(manifest));
  }
  outputs.set(join(root, ".codex", "config.toml"), renderCodexConfig());
  outputs.set(join(root, ".codex", "hooks.json"), renderCodexHooks());
  outputs.set(join(root, ".codex", "rules", "sky-safety.rules"), renderCodexRules());
  outputs.set(join(root, ".agents", "hooks.json"), renderAntigravityHooks());
  outputs.set(join(root, ".agents", "mcp_config.json"), renderMcpConfig());
  outputs.set(join(root, ".agents", "rules", "00-engineering-constitution.md"), renderAntigravityRule());
  const manifestHash = sha(manifests.map((manifest) => stableJson(manifest, 0)).join("\n"));
  outputs.set(join(root, ".agents", "generated", "HOST_PARITY.json"), JSON.stringify({
    schema_version: "1.0.0",
    manifest_sha256: manifestHash,
    roles: { standing_agents: 11, verifiers: 11, specialists: 9 },
    universal_mcp: ["context7", "graphify"],
    model_sources: modelMap.sources,
    model_verified_on: modelMap.verified_on,
    semantic_parity: true,
    host_runtime: runtimeStatus.hosts,
    antigravity_cli_runtime_verified: runtimeStatus.hosts.antigravity.runtime_verified,
    antigravity_cli_runtime_note: runtimeStatus.hosts.antigravity.note
  }, null, 2) + "\n");
  return outputs;
}

function cleanGeneratedRoleDirs(manifests) {
  const ids = new Set(manifests.map((m) => m.identity.id));
  const codexDir = join(root, ".codex", "agents");
  if (existsSync(codexDir)) for (const file of readdirSync(codexDir)) if (file.endsWith(".toml") && !ids.has(file.replace(/\.toml$/, ""))) rmSync(join(codexDir, file));
  const antigravityDir = join(root, ".agents", "agents");
  if (existsSync(antigravityDir)) for (const entry of readdirSync(antigravityDir, { withFileTypes: true })) if (entry.isDirectory() && !ids.has(entry.name)) rmSync(join(antigravityDir, entry.name), { recursive: true, force: true });
}

function compile(outputs, manifests) {
  cleanGeneratedRoleDirs(manifests);
  for (const [path, content] of outputs) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, "utf8");
  }
  console.log(JSON.stringify({ ok: true, mode: "compile", generated: outputs.size, roles: manifests.length }, null, 2));
}

function check(outputs) {
  const drift = [];
  for (const [path, expected] of outputs) {
    const actual = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (actual !== expected) drift.push(relative(root, path));
  }
  if (drift.length) {
    console.error(JSON.stringify({ ok: false, mode: "check", drift }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, mode: "check", checked: outputs.size }, null, 2));
}

export function extractSemantic(source) {
  const match = source.match(/BEGIN SEMANTIC CONTRACT\s+(?:```json\s+)?([\s\S]*?)(?:\s+```)?\s+END SEMANTIC CONTRACT/);
  if (!match) throw new Error("Generated adapter is missing its semantic contract");
  return JSON.parse(match[1].trim());
}

export function runParity(manifests) {
  const failures = [];
  for (const manifest of manifests) {
    const id = manifest.identity.id;
    const canonical = stableJson(semanticContract(manifest), 0);
    const codexPath = join(root, ".codex", "agents", `${id}.toml`);
    const antigravityPath = join(root, ".agents", "agents", id, "agent.md");
    for (const [host, path] of [["codex", codexPath], ["antigravity", antigravityPath]]) {
      if (!existsSync(path)) { failures.push(`${host}:${id}:missing`); continue; }
      try {
        if (stableJson(extractSemantic(readFileSync(path, "utf8")), 0) !== canonical) failures.push(`${host}:${id}:semantic-drift`);
      } catch (error) { failures.push(`${host}:${id}:${error.message}`); }
    }
    const codex = existsSync(codexPath) ? readFileSync(codexPath, "utf8") : "";
    const antigravity = existsSync(antigravityPath) ? readFileSync(antigravityPath, "utf8") : "";
    if (manifest.execution_mode.read_only && !/sandbox_mode = "read-only"/.test(codex)) failures.push(`codex:${id}:not-read-only`);
    if (manifest.execution_mode.read_only && /replace_file_content|write_to_file/.test(antigravity.split("---", 2)[1] ?? "")) failures.push(`antigravity:${id}:write-tool-exposed`);
    if ((id === "A0") !== /mainAgent: true/.test(antigravity)) failures.push(`antigravity:${id}:root-mismatch`);
  }
  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, semantic_roles_compared: manifests.length, only_root: "A0", universal_mcp: ["graphify", "context7"] }, null, 2));
}

const manifests = loadOrganization();
const outputs = expectedOutputs(manifests);
if (mode === "compile") compile(outputs, manifests);
else if (mode === "check") check(outputs);
else if (mode === "parity") runParity(manifests);
else if (mode === "validate") console.log(JSON.stringify({ ok: true, manifests: manifests.length }, null, 2));
else throw new Error(`Unknown mode ${mode}`);
