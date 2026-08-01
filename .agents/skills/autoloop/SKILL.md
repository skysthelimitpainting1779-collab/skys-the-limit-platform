---
name: autoloop
description: Automated discovery and execution engine for tasks, features, bugs, and improvements via the closed-loop engine.
triggers:
  - autoloop
  - /autoloop
  - auto loop
  - discover and fix
---

# Skill: autoloop (Automated Closed-Loop Task Discovery & Execution)

This skill scans the project for backlog items, open GitHub issues, TODO comments, code health/Lighthouse opportunities, and unhandled errors, compiles them into bounded work nodes in `.agent/graph/foundation.graph.json`, and executes them through the mandatory closed-loop execution engine.

---

## 1. Discovery Phase (Multi-Source Scanner)

When `/autoloop` is triggered, scan all of the following sources in order:

### A. Source 1: Local Knowledge Graph & Code Health (`graphify`)
- Query `graphify-out/graph.json` or run `graphify god-nodes` to detect structural friction, unlinked modules, or missing test coverage across core architectural hubs.
- Run `graphify reflect` to inspect `graphify-out/reflections/LESSONS.md` for unhandled error patterns.

### B. Source 2: Codebase TODOs / FIXMEs / HACKs
- Run AST / static check for code annotations:
  - `TODO:`
  - `FIXME:`
  - `HACK:`
  - `OPTIMIZE:`

### C. Source 3: Open GitHub Issues & Security Vulnerabilities
- Fetch open GitHub issues via `gh issue list --repo <repo> --json number,title,body,labels`.
- Fetch dependabot vulnerabilities: `gh api repos/<repo>/dependabot/alerts`.

### D. Source 4: User-Prompted Backlog & Custom Directives
- Scan `.agents/ORIGINAL_REQUEST.md` and `docs/decisions/` for incomplete feature requirements or pending ADR implementations.

---

## 2. Compilation Phase (Work Graph Builder)

1. Aggregate all discovered items into bounded work nodes.
2. Deduplicate against completed nodes in `.agent/state/controller.json`.
3. Format each item into `.agent/graph/foundation.graph.json` with node schema:
   ```json
   {
     "id": "AUTO-001",
     "title": "Short descriptive title of discovery",
     "status": "pending",
     "risk": "medium",
     "dependencies": [],
     "allowed_paths": ["src/..."],
     "expected_outputs": ["src/..."],
     "tests": ["src/__tests__/auto-001.test.ts"],
     "verification_commands": ["npm run typecheck", "npm test"],
     "external_effects": [],
     "retry_count": 0,
     "max_retries": 2
   }
   ```
4. Validate dependencies, risk levels, and stop conditions.

---

## 3. Closed-Loop Execution Lifecycle

For every compiled node, execute the exact closed-loop engine lifecycle:

```text
DISCOVER
→ DEFINE CONTRACT
→ WRITE OR CONFIRM FAILING TEST
→ IMPLEMENT MINIMUM CHANGE
→ RUN FOCUSED VERIFICATION (npm run typecheck && npm test)
→ RUN BROADER REGRESSION VERIFICATION (npm run verify)
→ INDEPENDENTLY EVALUATE (Dual-agent peer review)
→ RECORD EVIDENCE (.agent/state/nodes/<node-id>.json)
→ COMMIT (git commit)
→ PUSH (git push)
→ VERIFY GITHUB CI (node scripts/verify-ci.mjs)
→ VERIFY VERCEL PREVIEW
→ REMEDIATE OR ADVANCE
```

---

## 4. Governance & Safety Rules

- **Zero-Bypass**: No node may skip from implementation to completion without independent evaluator review (`pass`).
- **Production Gate**: Stop at `human_approval_required` if a node impacts production data, live Stripe, or customer email.
- **Graph Maintenance**: Run `graphify update .` after each node completion.
- **Traceability**: Record execution telemetry in `.agent/logs/execution.jsonl`.
