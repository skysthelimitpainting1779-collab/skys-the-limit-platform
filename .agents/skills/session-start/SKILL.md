---
name: session-start
description: >
  Mandatory session start checklist for the Sky's the Limit platform. Run this at the
  beginning of every session before touching any code. Triggered by: "start session",
  "begin work", "new session", or automatically at the start of any implementation task.
---

# Session Start Checklist

Execute these in order. Do NOT skip. Do NOT proceed to code until all pass.

## 1. Read Past Lessons
```
view_file graphify-out/reflections/LESSONS.md
```
Learn what went wrong in past sessions. Common pitfalls recorded here.

## 2. Query Graphify for Relevant Components
```
call_mcp_tool codebase-memory-mcp/query_graph { "query": "<your task description>" }
```
Map what components are affected BEFORE reading any raw files.

## 3. Read Convex Guidelines (if touching Convex)
```
view_file convex/_generated/ai/guidelines.md
```
Mandatory before editing anything in `convex/`. The file overrides training data.

## 4. Fetch Library Docs via Context7 (if touching external APIs)
```
call_mcp_tool context7/resolve-library-id { "libraryName": "<library>" }
call_mcp_tool context7/query-docs { "context7CompatibleLibraryID": "<id>", "topic": "<specific question>" }
```
Never trust training data for APIs. Always fetch.

## 5. State North Star + Scope Hygiene
Write explicitly:
- **North Star**: One sentence — what does this session accomplish?
- **In scope**: Files that WILL be touched
- **Out of scope**: Files that will NOT be touched (especially `raw/` which is NEVER touched)

## 6. Check Branch
```
run_command "git branch --show-current"
```
Must be on a `feature/*`, `fix/*`, `infra/*`, or `docs/*` branch. Never `main` or `dev`.

---

Only after all 6 steps pass: proceed to implementation.
