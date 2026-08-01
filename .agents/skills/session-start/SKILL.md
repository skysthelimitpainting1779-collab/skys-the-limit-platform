---
name: session-start
description: >
  Mandatory session start checklist for the Sky's the Limit platform.
  Enforces discovery protocol, branch hygiene, and context loading before any code change.
triggers:
  - session start
  - begin work
  - start session
  - new task
---

# Skill: session-start

## Trigger
Run at the beginning of every implementation session, before touching any file.

## Purpose
Enforce the AGENTS.md §3 discovery protocol: load lessons, query the knowledge graph,
read Convex guidelines, fetch library docs via Context7, state scope, and verify branch.
Prevents the violations pattern of: grep-first, skip-graphify, skip-context7, no peer review.

## Required Inputs
- Task description (what this session will accomplish)
- List of libraries that will be used (Convex, Next.js, shadcn, etc.)
- Target branch name

## Allowed Files
- `graphify-out/reflections/LESSONS.md` (read only)
- `convex/_generated/ai/guidelines.md` (read only)
- `docs/context/*.md` (read only)
- `.agents/AGENTS.md` (read only)
- `AGENTS.md` (read only)

## Discovery Steps

Execute in order. Do NOT skip. Stop and report if any step fails.

**Step 1 — Read Past Lessons**
```
view_file  graphify-out/reflections/LESSONS.md
```
Learn what failed in past sessions. Do not repeat recorded mistakes.

**Step 2 — Query Graphify**
```
call_mcp_tool  codebase-memory-mcp  query_graph  { "query": "<task description>" }
```
Map affected components before reading any raw files. grep is a last resort.

**Step 3 — Read Convex Guidelines (if touching Convex)**
```
view_file  convex/_generated/ai/guidelines.md
```
Overrides training data. Non-negotiable before any edit to `convex/`.

**Step 4 — Fetch Library Docs via Context7 (if touching external APIs)**
```
call_mcp_tool  context7  resolve-library-id  { "libraryName": "<library>" }
call_mcp_tool  context7  query-docs          { "context7CompatibleLibraryID": "<id>", "topic": "<question>" }
```

**Step 5 — State North Star and Scope**
Write explicitly before first edit:
- **North Star**: One sentence — what does this session accomplish?
- **In scope**: files that WILL be touched
- **Out of scope**: files that will NOT be touched (`raw/` is ALWAYS out of scope)

**Step 6 — Verify Branch**
```
run_command  git branch --show-current
```
Must be on `feature/*`, `fix/*`, `infra/*`, `docs/*`, or `agent/*`.
Never `main` or `dev`.

## Current-Doc Requirement
Every session touching a third-party API MUST call Context7 `resolve-library-id` + `query-docs`
before any implementation. Training-data API knowledge is considered stale and unreliable.

## Test-First Sequence
1. Identify which existing tests cover the area being changed.
2. If no test exists, write the failing test first.
3. Implement the minimum change to make the test pass.
4. Run `npm test` to confirm regression-free.

## Verification Commands
```bash
git branch --show-current
npm run verify:skills
npm run typecheck
npm test
```

## Evidence Format
Log session start completion before first edit:
```
SESSION START: <ISO date>
NORTH STAR: <one sentence>
IN SCOPE: <files>
OUT OF SCOPE: <files>
BRANCH: <name>
LESSONS REVIEWED: yes
GRAPHIFY QUERIED: yes
CONVEX GUIDELINES READ: yes | n/a
CONTEXT7 FETCHED: yes | n/a
```

## Stop Conditions
- Not on a feature/fix/infra/docs/agent branch → stop, checkout correct branch first
- `graphify-out/reflections/LESSONS.md` missing → run `graphify reflect` first
- `convex/_generated/ai/guidelines.md` missing → run `npx convex dev` to generate
- Context7 unavailable → report blocker, do not proceed with library-touching work

## Handoff Format
After checklist passes, state before first tool call:
```
CHECKLIST: complete
NORTH STAR: <sentence>
BRANCH: <name>
FIRST ACTION: <what you will do next>
```
