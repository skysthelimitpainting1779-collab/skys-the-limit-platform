import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../..", import.meta.url));

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function normalizePayload(input = {}, explicitAgent = "") {
  const args = input.tool_input ?? input.toolCall?.args ?? input.args ?? {};
  const tool = String(input.tool_name ?? input.toolCall?.name ?? input.toolName ?? "");
  const command = String(args.command ?? args.CommandLine ?? args.cmd ?? input.command ?? "");
  const agent = normalizeAgent(explicitAgent || input.agent_name || input.agent_id || input.agentId || input.source_agent || args.source_agent || args.sourceAgent);
  const targets = extractTargets(args, command);
  return { input, args, tool, command, agent, targets };
}

function normalizeAgent(value) {
  return String(value ?? "").toUpperCase().match(/\b([AVS](?:[0-9]|10))\b/)?.[1] ?? "";
}

function extractTargets(args, command) {
  const values = [args.file_path, args.path, args.TargetFile, args.target_file, args.SearchPath, args.search_path, args.SearchDirectory]
    .filter((value) => typeof value === "string");
  const patch = [args.patch, args.command, command].find((value) => typeof value === "string" && value.includes("*** ")) ?? "";
  for (const match of patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File:\s*(.+)$/gmu)) values.push(match[1].trim());
  return [...new Set(values.map(normalizePath).filter(Boolean))];
}

function normalizePath(value) {
  let path = String(value).trim().replace(/^['"]|['"]$/g, "").replaceAll("\\", "/");
  const absoluteRoot = root.replaceAll("\\", "/").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  path = path.replace(new RegExp(`^${absoluteRoot}/?`, "i"), "");
  return path.replace(/^\.\//, "");
}

function currentBranch(input) {
  if (input.current_branch) return String(input.current_branch);
  try {
    return execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function currentSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function loadManifests() {
  const manifests = new Map();
  for (const directory of ["agents", "verifiers", "specialists"]) {
    const path = join(root, ".agents", "manifests", directory);
    for (const file of readdirSync(path).filter((name) => name.endsWith(".json"))) {
      const manifest = json(join(path, file));
      manifests.set(manifest.identity.id, manifest);
    }
  }
  return manifests;
}

let manifestCache;
function manifestFor(agent) {
  manifestCache ??= loadManifests();
  return manifestCache.get(agent);
}

function globRegex(glob) {
  let pattern = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === "*" && glob[index + 1] === "*") {
      if (glob[index + 2] === "/") { pattern += "(?:.*/)?"; index += 2; }
      else { pattern += ".*"; index += 1; }
    } else if (char === "*") pattern += "[^/]*";
    else if (char === "?") pattern += "[^/]";
    else pattern += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${pattern}$`, "i");
}

function matchesAny(path, globs) {
  return globs.some((glob) => globRegex(glob).test(path));
}

function isMutationTool(tool) {
  return /apply_patch|write|replace|edit|delete|move|rename/i.test(tool);
}

function isMutatingCommand(command) {
  return /(?:^|[;&|]\s*)(?:git\s+(?:add|commit|push|merge|rebase|cherry-pick|revert)|npm\s+(?:install|uninstall|update)|npx\s+(?:vercel|convex)|(?:Set-Content|Add-Content|Out-File|New-Item|Remove-Item|Move-Item|Copy-Item)\b|(?:rm|mv|cp|touch|mkdir)\b)|(?:^|[^>])>{1,2}(?!=)/i.test(command);
}

function protectedEvalTarget(target) {
  return matchesAny(target, [
    ".agents/evals/metrics/**", ".agents/evals/held-out/**", ".agents/evals/rubrics/**",
    ".agents/evals/fixtures/protected/**", ".agents/evals/thresholds.json",
  ]);
}

function dangerousGit(command) {
  const rules = [
    [/\bgit\s+add\s+\.(?:\s|$)/i, "Stage explicit files instead of git add ."],
    [/\bgit\s+add\s+-A(?:\s|$)/i, "Stage explicit files instead of git add -A."],
    [/\bgit\s+commit\b[^\r\n]*\s-a(?:\s|$)/i, "Stage explicit files before committing."],
    [/\bgit\s+push\b[^\r\n]*(?:--force(?:-with-lease)?|-f)(?:\s|$)/i, "Force-push is prohibited."],
    [/\bgit\s+reset\s+--hard\b/i, "Hard reset is prohibited."],
    [/\bgit\s+clean\s+-[^\s]*f[^\s]*d|\bgit\s+clean\s+-[^\s]*d[^\s]*f/i, "Destructive clean is prohibited."],
    [/\b--no-verify\b/i, "Hook bypass is prohibited."],
    [/\bgit\s+push\b[^\r\n]*(?:\bmain\b|\bdev\b)/i, "Direct pushes to main or dev are prohibited."],
  ];
  return rules.find(([pattern]) => pattern.test(command))?.[1] ?? null;
}

function productionViolation(normalized) {
  const text = [normalized.command, ...normalized.targets].join("\n");
  const rules = [
    [/(?:^|[\s/'"])(?:\.env\.production(?:\.local)?|\.env\.prod|prod\.secret)(?=$|[\s'";,\]}])/im, "Production environment and secret files are immutable to agents."],
    [/\b(?:npx\s+)?vercel\b[^\r\n]*(?:--prod|promote|rollback|domains?\s+(?:add|rm|remove))/i, "Production deployment, promotion, rollback, and domain mutation require human approval."],
    [/\b(?:npx\s+)?convex\b[^\r\n]*(?:deploy\b[^\r\n]*--prod|--prod\b|production)/i, "Production Convex deployment or mutation is prohibited."],
    [/\bstripe\b[^\r\n]*(?:--live|live_mode|payment_intents?\s+create)/i, "Live payment activation is prohibited."],
    [/\b(?:resend|twilio)\b[^\r\n]*(?:send|messages?\s+create)/i, "Live customer communication is prohibited."],
    [/\b(?:cloudflare|vercel)\b[^\r\n]*(?:dns|domain)\b[^\r\n]*(?:create|add|delete|remove|update)/i, "DNS and production-domain mutation is prohibited."],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

function graphifyDiscovery(normalized) {
  const command = normalized.command;
  const argsText = JSON.stringify(normalized.args);
  const broadCommand = /(?:^|[;&|]\s*|\s)(?:rg|grep)(?:\.exe)?\s|Select-String\b|(?:Get-ChildItem|gci|dir)\b[^\r\n]*(?:-Recurse|-r\b)|(?:rg|grep)\b[^\r\n]*--files/i.test(command);
  const searchTool = /grep_search|find_by_name/i.test(normalized.tool);
  if (!broadCommand && !searchTool) return false;
  if (/(?:^|[\s'"])(?:\.agents|\.codex|\.github|docs?)(?:[\\/\s'"]|$)/i.test(command)
      && !/(?:^|[\s'"])(?:src|convex|app|components|hooks|lib)[\\/]/i.test(command)) return false;
  const exactLiteralOrConfig = /(?:\.agents|\.codex|\.github|docs?|package\.json|\.md|\.json|\.toml|\.ya?ml)/i.test(`${command} ${argsText}`)
    && !/(?:src|convex|app|components|hooks|lib)[\\/]|\.(?:ts|tsx|js|jsx|mjs|cjs)\b/i.test(`${command} ${argsText}`);
  if (exactLiteralOrConfig) return false;
  return /(?:src|convex|app|components|hooks|lib)|\.(?:ts|tsx|js|jsx|mjs|cjs)\b|function|class|import|export|component|route|caller|dependency|test/i.test(`${command} ${argsText}`);
}

function validExhaustionRecord(record, normalized, shaValue) {
  const required = ["graph_query", "failure", "allowed_path", "pattern", "expires_at", "candidate_sha"];
  if (required.some((field) => typeof record[field] !== "string" || !record[field].trim())) return false;
  if (Date.parse(record.expires_at) <= Date.now()) return false;
  if (record.candidate_sha !== shaValue) return false;
  const scope = `${normalized.command}\n${JSON.stringify(normalized.args)}`.replaceAll("\\", "/").toLowerCase();
  return scope.includes(record.allowed_path.replaceAll("\\", "/").toLowerCase()) && scope.includes(record.pattern.toLowerCase());
}

function hasValidExhaustion(normalized, overrideRecord = null, overrideSha = "") {
  if (overrideRecord) return validExhaustionRecord(overrideRecord, normalized, overrideSha || currentSha());
  const branch = currentBranch(normalized.input) || "detached";
  const slug = branch.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  const path = join(root, ".agents", "evidence", "graphify-exhaustion", `${slug}.json`);
  if (!existsSync(path)) return false;
  try {
    return validExhaustionRecord(json(path), normalized, currentSha());
  } catch {
    return false;
  }
}

function circuitViolation(agent, overrideLedger = null) {
  if (!agent) return null;
  const path = join(root, ".agents", "runtime", "CIRCUIT_STATE.json");
  if (!overrideLedger && !existsSync(path)) return "Circuit state is missing; agent execution cannot be proven bounded.";
  try {
    const ledger = overrideLedger ?? json(path);
    const state = ledger.active_circuits?.[agent]?.state;
    if (!state) return `Circuit state is missing for ${agent}.`;
    if (state === "OPEN") return `${agent} circuit is OPEN; only A0 may authorize one HALF_OPEN probe after materially new evidence.`;
    if (!new Set(["CLOSED", "HALF_OPEN"]).has(state)) return `${agent} circuit has invalid state ${state}.`;
  } catch {
    return "Circuit ledger is malformed; agent execution cannot be proven bounded.";
  }
  return null;
}

function targetAgents(normalized) {
  const candidates = [normalized.args.target_agent, normalized.args.targetAgent, normalized.args.target, normalized.args.recipient, normalized.args.Recipient, normalized.args.agent_id, normalized.args.agent_type];
  if (Array.isArray(normalized.args.Subagents)) for (const item of normalized.args.Subagents) candidates.push(item?.TypeName, item?.Role);
  return [...new Set(candidates.map(normalizeAgent).filter(Boolean))];
}

function communicationViolation(normalized) {
  if (!/send_message|invoke_subagent|spawn_agent|define_subagent/i.test(normalized.tool)) return null;
  const source = normalized.agent;
  const targets = targetAgents(normalized);
  if (!source || !targets.length) return "Agent communication identity is missing; fail closed instead of inventing a sender or target.";
  const manifest = manifestFor(source);
  if (!manifest) return `Unknown source agent ${source}.`;
  const disallowed = targets.find((target) => !manifest.communication.may_message.includes(target));
  return disallowed ? `${source} may not message or spawn ${disallowed}; route standing-agent coordination through A0.` : null;
}

function scopeViolation(normalized) {
  const manifest = manifestFor(normalized.agent);
  if (!manifest) return null;
  const mutating = isMutationTool(normalized.tool) || isMutatingCommand(normalized.command);
  if (!mutating) return null;
  if (manifest.execution_mode.read_only) return `${normalized.agent} is mechanically read-only.`;
  for (const target of normalized.targets) {
    if (protectedEvalTarget(target)) return `${target} is protected evaluation authority and cannot be changed by ${normalized.agent}.`;
    if (matchesAny(target, manifest.write_scope.deny)) return `${normalized.agent} is denied from writing ${target}.`;
    if (!matchesAny(target, manifest.write_scope.allow)) return `${normalized.agent} has no write authority for ${target}.`;
  }
  return null;
}

export function evaluatePreTool(input, explicitAgent = "", overrides = {}) {
  const normalized = normalizePayload(input, explicitAgent);
  const circuit = circuitViolation(normalized.agent, overrides.circuitState);
  if (circuit) return { allow: false, code: "CIRCUIT", reason: circuit };

  const git = dangerousGit(normalized.command);
  if (git) return { allow: false, code: "GIT", reason: git };

  const production = productionViolation(normalized);
  if (production) return { allow: false, code: "PRODUCTION", reason: production };

  if ((isMutationTool(normalized.tool) || isMutatingCommand(normalized.command)) && ["main", "dev"].includes(currentBranch(input))) {
    return { allow: false, code: "PROTECTED_BRANCH", reason: "Implementation on main or dev is prohibited; use an isolated worktree and feature branch." };
  }

  for (const target of normalized.targets) {
    if (protectedEvalTarget(target)) return { allow: false, code: "PROTECTED_EVAL", reason: `${target} is human-governed protected evaluation authority.` };
  }

  const communication = communicationViolation(normalized);
  if (communication) return { allow: false, code: "ACL", reason: communication };

  const scope = scopeViolation(normalized);
  if (scope) return { allow: false, code: "SCOPE", reason: scope };

  if (graphifyDiscovery(normalized) && !hasValidExhaustion(normalized, overrides.exhaustionRecord, overrides.currentSha)) {
    return { allow: false, code: "GRAPHIFY", reason: "Broad code discovery is denied. Query Graphify first; a fallback requires a current-SHA, branch-scoped exhaustion record matching the exact path and pattern." };
  }

  return { allow: true };
}

export function verifyRootContainment(path) {
  const absolute = resolve(root, path);
  return relative(root, absolute) && !relative(root, absolute).startsWith("..") && !relative(root, absolute).includes(`..${join("x", "").slice(1)}`);
}
