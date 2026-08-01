# AGENTS.md — Workspace Rules (Auto-injected by Antigravity every session)
# Sky's the Limit Platform | Enforcement Layer

> This file is the Antigravity workspace rule. It is auto-loaded at session start.
> Full governance lives in [AGENTS.md](../AGENTS.md) at the repo root.
> This file is the enforcement adapter — it maps every mandate to exact Antigravity tool calls.

---

## STEP 0: SESSION START CHECKLIST (RUN BEFORE ANY EDIT)

You MUST execute these steps before touching any file:

1. **Read lessons**: `view_file graphify-out/reflections/LESSONS.md` — learn from past session errors
2. **Query graph**: `call_mcp_tool codebase-memory-mcp/query_graph` with the relevant concept — never grep raw files first
3. **Read Convex guidelines**: `view_file convex/_generated/ai/guidelines.md` — mandatory before any Convex edit
4. **State your North Star**: One sentence: what is the single thing this session accomplishes?
5. **State scope hygiene**: What files will NOT be touched?

If any of these fails or is skipped — STOP and report the blocker.

---

## MANDATORY PROTOCOL ENFORCEMENT

### §0 PEER REVIEW — Every Node (ZERO EXCEPTIONS)

After implementing any work node:
1. `invoke_subagent` with `TypeName: "self"` and role `"Peer Evaluator"`
2. Evaluator prompt MUST include: the commit SHA, all changed files, test output, and the contract from AGENTS.md
3. Evaluator MUST check: contract compliance, architecture violations, security risks, false completion claims
4. Record verdict to `.agent/state/nodes/<node-id>.json`
5. A `remediate`, `human_review`, or `rollback` verdict BLOCKS advancement

### §1 CONTEXT7 — All Third-Party APIs (NO TRAINING DATA)

Before using ANY external library (Convex, Next.js, shadcn, motion, Stripe, WorkOS):
1. `call_mcp_tool context7/resolve-library-id` with the library name
2. `call_mcp_tool context7/query-docs` with exact library ID and specific question
3. Base implementation ONLY on fetched docs

### §1.5 GRAPHIFY FIRST — Before Any File Read

1. `call_mcp_tool codebase-memory-mcp/query_graph` — ALWAYS run first
2. `call_mcp_tool codebase-memory-mcp/trace_path` — for component relationships
3. grep / list_dir / view_file = LAST RESORT only if Graphify returns nothing

### §1.7 SEQUENTIAL THINKING — Complex Problems

Trigger `call_mcp_tool sequential-thinking/sequentialthinking` when:
- Debugging an error that spans multiple files
- Designing a schema or API change
- Resolving a CI failure with an unknown root cause
- Any refactor touching > 3 files

### §1.8 LEARNING — Record Every Mistake

After ANY failed tool call or dead-end approach:
1. Note the failure in working memory
2. After session: run `graphify reflect` to update `graphify-out/reflections/LESSONS.md`

---

## HARD STOPS — ESCALATE TO OWNER IMMEDIATELY

- Secret or credential detected in working tree
- Any CI security-class failure
- Peer evaluator returns `rollback`
- About to merge `dev → main` (requires human approval)
- About to mutate production Convex data
- About to attach or move production domain

---

## BRANCH POLICY (non-negotiable)

- `main` ← release PRs only, requires owner approval
- `dev` ← feature PRs only, no direct commits
- `feature/*` `fix/*` `infra/*` — one branch per node
- Never force-push shared branches
