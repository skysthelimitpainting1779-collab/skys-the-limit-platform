## 2026-08-01T19:26:53Z

<USER_REQUEST>
You are a Worker subagent (working directory: C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_m2).
Your task is to execute Milestone 2: Backend Convex database mutations & queries for leads, estimates, jobs, users, and audit events in `convex/`.

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Specific instructions:
1. Initialize working directory C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_m2 with BRIEFING.md and progress.md.
2. Use Context7 MCP (`resolve-library-id` for `convex` and `query-docs`) to research authoritative Convex query, mutation, and v (validator) patterns.
3. Review `convex/schema.ts` to understand table structures (`users`, `organizations`, `memberships`, `leads`, `estimates`, `jobs`, `auditEvents`) and indexes.
4. Implement complete, production-grade Convex query and mutation endpoints in `convex/`:
   - `convex/leads.ts`: `create`, `get`, `list`, `updateStatus`, `search` (utilizing validators `v` and indexes).
   - `convex/estimates.ts`: `create`, `get`, `listByLead`, `update`, `calculateTotal`.
   - `convex/jobs.ts`: `createFromEstimate`, `get`, `list`, `updateStatus`, `assignCrew`.
   - `convex/users.ts`: `get`, `getByClerkId`, `store`, `updateRole`, `list`.
   - `convex/auditEvents.ts`: `log`, `listByEntity`, `listRecent`.
5. Add unit test suites in `tests/` or `convex/` verifying the functionality of Convex schema and helper functions.
6. Run `npm test` and `npm run typecheck` (or `npm run verify:branch` / `npm run verify`) to ensure 100% clean build and green tests.
7. Write `changes.md` and `handoff.md` in your working directory.
8. Message the orchestrator (conversation ID: cd97b26a-6d33-46ea-8a37-fdbc6cbd4387, Recipient: parent) with a summary of changes and handoff path.
</USER_REQUEST>
