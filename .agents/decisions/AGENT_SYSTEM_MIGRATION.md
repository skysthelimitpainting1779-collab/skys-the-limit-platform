# Agent-system inventory and migration matrix

This inventory is scoped to the cross-host engineering system. Git history preserves removed artifacts; deletion from the active tree does not erase provenance.

| Artifact / capability | Current evidence | Classification | Operational action |
|---|---|---|---|
| Platform root `AGENTS.md` | Monolithic prompt with mandatory peer evaluator, generic Context7/sequential-thinking/skill calls, `.agent/state` authority, and stale rollback/bypass language | **REPLACE** | Reduce to the host-neutral constitution and architecture authority. |
| Platform `.agents/AGENTS.md` | Thin but points to the self-cloned peer evaluator and obsolete MCP name | **UPGRADE** | Make it a thin Antigravity adapter to the portable constitution/kernel. |
| Platform per-task `.agents/*_m*/` briefings | Historical execution records, not reusable standing agents | **CONSOLIDATE** | Preserve in Git history; remove from active agent discovery after successor manifests are certified. |
| Platform `.agent/state` and `autoloop` task graph | Duplicates durable GitHub Issue/PR state | **REPLACE** | Stop active writes; use GitHub as task truth. Preserve historical records in Git history. |
| Platform Convex and design skills | Real executable skills and generated Convex guidance | **PRESERVE** | Route narrowly from semantic manifests; validate and avoid bulk loading. |
| Platform `peer-evaluator` skill | Evaluator can write `src/**` and `convex/**` and receives implementer context | **REPLACE** | Clean-context V0–V10, strict read-only sandboxes, exact evidence packets. |
| Platform `.codex/hooks.json` | Hardcoded machine path and incomplete policy surface | **REPLACE** | Portable Codex adapter over one shared policy core. |
| Website PR #189 | Antigravity-first A/V manifests and 16 checks with documented false-pass gaps | **CONSOLIDATE** | Reuse proven concepts and regression cases; supersede the PR. |
| Local website Codex candidate `a722f062` | Valid Codex profiles, dual-host payload adapter, production-guard remediation, exact-SHA evidence model | **CONSOLIDATE** | Port behavior selectively into platform semantic manifests/compiler; do not copy stale website architecture. |
| Host-neutral semantic manifests | Missing in platform | **UPGRADE** | Create schema-validated A0–A10, V0–V10, and S1–S8 definitions. |
| Antigravity native team | Missing standing organization in platform | **UPGRADE** | Generate current native agents, rules, hooks, MCP config, and capability mapping. |
| Codex native team | Only a hooks file exists | **UPGRADE** | Generate first-class profiles, config, rules, and hooks with semantic parity. |
| `host:compile`, `host:check`, `agents:parity` | Missing | **UPGRADE** | Build one deterministic semantic compiler, drift check, and parity evaluator. |
| Graphify graph/query/hooks | Working but hooks contain a pinned user path; global graph unverified | **UPGRADE** | Preserve graph engine; make root resolution portable, isolate worktree graphs, certify reverse impact/memory/global behavior. |
| Context7 | Rules are universal and ceremonial | **UPGRADE** | Universal access with task-sensitive invocation and exact evidence contract. |
| Entire CLI | Present in the website Husky chain, absent in platform hooks | **MIGRATE** | Add without removing Graphify/Husky gates; keep provenance separate from task/verification truth. |
| Platform Husky hooks | Strong secret/asset checks, Graphify hooks, but `pre-push` documents `--no-verify` bypass | **UPGRADE** | Preserve checks, remove bypass authorization, add Entire calls, certify Windows/Linux behavior. |
| GitHub workflow suite | CI, security, lead E2E, Preview, release, and Eve factory exist | **PRESERVE & HARDEN** | Add agent manifests/parity/eval/tool gates to existing workflows; keep exact-head evidence. |
| Vercel project and Preview | Connected; tracked/remote build command drift observed | **PRESERVE & RECONCILE** | Diagnose drift through read-only evidence and PR checks; no Production mutation. |
| Convex / WorkOS platform boundary | Implemented with security tests and current packages | **PRESERVE** | Agents enforce ownership and fail-closed rules; no Production mutation. |
| Supabase / Payload / Directus / libSQL / Express | Present in website dependency/runtime history, absent from platform target package | **REMOVE FROM CANONICAL AUTHORITY** | Block reintroduction into platform; migrate useful data/content only through separate approved work. |
| Quality constitution and protected evals | No protected cross-host quality system in platform | **UPGRADE** | Add protected metrics, public/held-out cases, false-PASS cases, canaries, promotion gate, and tamper checks. |
| Circuit and loop enforcement | Prompt-only or website-local partial implementation | **REPLACE** | Small persistent runtime state plus shared deterministic policy; only A0 may half-open. |
| `dev-healer` | Website-local/on-demand capability; no measured platform consumer | **MERGE INTO ERROR-LEARNING PILOT** | Do not install as an autonomous sidecar; adopt only if a seeded pilot proves incremental value. |
| Deterministic OSS tools | Not systematically piloted | **UPGRADE** | Pilot in required order against seeded defects; record adopt/reject scorecards. |

## Preserved authorities

- GitHub Issues/PRs/checks and the existing workflow topology remain durable work and delivery truth.
- Entire remains execution provenance only.
- Graphify remains structural intelligence and provisional engineering memory.
- Context7 remains current external-library truth.
- Convex and WorkOS remain the platform state and identity boundaries.
- Human approval remains mandatory for Production, repository settings, domains, credentials, live communications, and payments.
