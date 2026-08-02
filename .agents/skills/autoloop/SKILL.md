---
name: autoloop
description: Automated discovery and execution engine for tasks, features, bugs, and improvements via the closed-loop engine.
---

## Trigger
Use when running automated backlog discovery, scanning for code annotations (TODO/FIXME), checking GitHub issues, or executing closed-loop task iterations.

## Purpose
Automates the discovery of backlog tasks, open GitHub issues, TODO/FIXME annotations, and code health opportunities, compiles them into `.agent/graph/foundation.graph.json`, and pipes each item through the mandatory closed-loop execution engine.

## Required Inputs
- Repository root path
- Open GitHub issues (`gh issue list`)
- Codebase TODO/FIXME annotations
- Graphify knowledge graph (`graphify-out/graph.json`)

## Allowed Files
- `.agent/graph/foundation.graph.json`
- `.agent/state/controller.json`
- `.agent/state/nodes/*.json`
- `src/**`
- `convex/**`
- `docs/**`

## Discovery Steps
1. **Graphify & Code Health**: Query `graphify god-nodes` and `LESSONS.md` to identify structural friction or error patterns.
2. **Code Annotations**: Scan codebase for `TODO:`, `FIXME:`, `HACK:`, and `OPTIMIZE:`.
3. **GitHub Issues & Dependabot**: Query open issues (`gh issue list`) and security alerts (`gh api repos/:owner/:repo/dependabot/alerts`).
4. **Pending ADR Specs**: Inspect `docs/decisions/` and `.agents/ORIGINAL_REQUEST.md` for pending requirements.

## Current-Doc Requirement
Every subagent dispatched by `/autoloop` must perform Context7 documentation lookups via `resolve-library-id` and `query-docs` before implementing third-party library code.

## Test-First Sequence
1. Write or confirm failing test before writing implementation logic.
2. Run focused test verification (`npm test`).

## Verification Commands
- `npm run verify:skills`
- `npm run verify:env`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Stop Conditions
- Evaluator returns `remediate`, `human_review`, or `rollback`.
- Node requires production-effect actions (live Stripe, live Email, DNS changes, database mutations).
- Verification commands fail after maximum allowed retries.

## Evidence Format
Persist evidence for each node to `.agent/state/nodes/<node-id>.json` including commit SHA, focused test output, regression test output, and independent evaluator verdict (`pass`).

## Handoff Format
Summarize execution telemetry in `.agent/logs/execution.jsonl` and post completion status (`DONE`, `BLOCKED`, `HUMAN_APPROVAL_REQUIRED`).
