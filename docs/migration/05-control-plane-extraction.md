# Control-Plane Extraction Plan

## Objective

Create a separate reusable repository, `skys-agent-control-plane`, for autonomous development infrastructure. The extraction is not a product-runtime feature and must not be bundled into the public website or the Convex application. Product repositories retain only product policy, product tests, CI/security contracts, a concise `AGENTS.md`, and a minimal adapter if invocation of the external control plane remains necessary.

## Verified current distribution

The website tracks approximately 325 files under agent/control-plane-related paths, including `.agents`, `.cursor`, `.claude`, `.codex`, `.gemini`, `.entire`, and `.qoder`. The platform tracks approximately 181 such files across `.agent`, `.agents`, `.claude`, `.codex`, and Graphify output. The platform’s `.agent/state/controller.json` is dynamic execution state; `.agents` contains historical worker briefings, handoffs, and progress files; and `.claude/skills` duplicates reusable Convex skills. These are not product runtime code.

| Material class | Current product locations | Target | Migration decision |
|---|---|---|---|
| Repository-specific policy | `AGENTS.md`, product `.github/**`, product test guidance | Product repository | Retain and simplify. It must state branch, test, release, and production-effect rules. |
| Reusable skills and evaluators | `.agents/skills/**`, `.claude/skills/**`, website plugins/skills | Control plane | Deduplicate by canonical content, preserve license/provenance, and test references. |
| Orchestration/worktree tooling | harness scripts, workflow templates, provider adapters, critic definitions | Control plane | Move only after a reference graph confirms product scripts do not require the old path. |
| Historical handoffs and worker logs | `.agents/*/handoff.md`, `progress.md`, `ORIGINAL_REQUEST.md`, generated reports | Control-plane archive or untracked run storage | Do not retain in product Git history going forward. Preserve only intentionally immutable fixtures. |
| Dynamic state/checkpoints | `.agent/state/**`, goal history, graph output, checkpoints, runtime DBs | Untracked control-plane state storage | Never commit to product source. Add explicit ignores after migration. |
| Product validation contracts | CI script checks, tests, immutable action policy, dependency checks | Product repository | Retain; these protect the product independently of orchestration tooling. |

## Extraction sequence

The control plane should be initialized as a private repository by default. Its root should contain orchestration source, execution graph schemas, worktree lifecycle code, builder/critic/evaluator interfaces, provider adapters, reusable skills, and tests. It must explicitly segregate source definitions from run state.

```text
product repository
  -> invokes a versioned control-plane command or CI adapter
  -> control plane creates isolated feature worktree
  -> builder implements one graph node
  -> critic validates node evidence
  -> product CI validates branch
  -> release branch receives verified changes
```

The first extraction commit must be read-only with respect to product runtime. It should establish a reference inventory and canonical skill map. The second slice moves one dependency-free reusable skill package and updates only the corresponding control-plane consumer. Product cleanup occurs only after a script/reference check proves the old path is not needed.

## Required target layout

| Target path | Responsibility | State policy |
|---|---|---|
| `src/orchestration/` | Task planning, dependency graphs, node state transitions | Source only |
| `src/worktrees/` | Isolated branch/worktree creation and cleanup | Source only |
| `src/agents/` | Builder, critic, evaluator interfaces and prompts | Source only |
| `src/providers/` | Provider adapters and credential boundaries | Source only; no secrets |
| `skills/` | Canonical reusable skills with provenance and tests | Source only |
| `templates/` | Workflow, issue, PR, and report templates | Source only |
| `tests/` | Unit, contract, and fixture-based evaluation tests | Source only |
| `.state/` | Runtime node state, checkpoints, logs, memory | Ignored; stored outside product repositories |
| `docs/` | Control-plane operation and security runbooks | Source only |

## Product adapter contract

Any product-facing adapter must accept a repository path, branch name, graph-node identifier, and declared verification commands. It must reject writes outside the node’s allowed paths and must not modify protected branches directly. The adapter output must include commit SHA, changed paths, command/exit-code evidence, reviewer/critic findings, and rollback command.

## Safety and licensing controls

External CRM and agent reference repositories are requirement sources, not code donors. Before importing any implementation, the control plane must record the license, copyright/provenance, package compatibility, and a reason a clean-room implementation is insufficient. AGPL code cannot be copied without explicit license analysis and approval.

The control plane may orchestrate feature branches and `dev`, but it cannot approve legally or financially consequential business actions. It must stop at approval gates for bids, contracts, certifications, pricing commitments, and external outreach where approval is required.

## Completion criteria

Extraction is complete only when dynamic state is ignored, reusable assets have one canonical home, product package scripts have no stale control-plane references, product CI remains independently enforceable, and all moved functionality has a test or a documented retirement decision. Until that condition is met, affected product paths remain **UNKNOWN** or **AGENT_CONTROL_PLANE**, never **DEAD**.
