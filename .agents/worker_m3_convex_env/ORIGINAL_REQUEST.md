## 2026-08-01T18:08:35Z
You are Worker 2 (`worker_m3_convex_env`) for Sky's the Limit Platform Foundation setup.
Working directory: C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_m3_convex_env\
Work Node ID: node-m3-convex-env

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY CONTEXT7 PROTOCOL:
You MUST use Context7 MCP (`resolve-library-id` + `query-docs`) for Convex schema definition documentation before modifying or finalizing `convex/schema.ts`.

Your Tasks:
1. Research Convex schema APIs via Context7 (`resolve-library-id` for `convex` -> `query-docs` on `defineSchema`, `defineTable`, `v` validators, `.index`).
2. Audit and finalize `convex/schema.ts` to ensure all 7 required core tables are defined with full field validators and indexes:
   - `users` (externalId, email, role, name, phone, avatarUrl, index: `by_externalId`)
   - `organizations` (name, slug, status, settings, index: `by_slug`)
   - `memberships` (userId, orgId, role, status, indexes: `by_user_org`, `by_org`, `by_user`)
   - `leads` (customerName, email, phone, address, projectType, status, notes, createdAt, index: `by_status`)
   - `estimates` (leadId, orgId, scope, pricing, status, createdAt, indexes: `by_lead`, `by_org`)
   - `jobs` (estimateId, orgId, status, schedule, crewIds, createdAt, indexes: `by_org`, `by_status`)
   - `auditEvents` (actorId, action, targetResource, metadata, timestamp, indexes: `by_target`, `by_actor`)
3. Audit `src/lib/environment/schema.ts` and `.env.example`:
   - Validate environment schema and ensure preview environment isolation guards are active.
   - Verify `.env.example` contains safe placeholder values for all environment keys.
4. Audit `.github/workflows/ci.yml` and `.github/workflows/security.yml`:
   - Verify `ci.yml` runs lint, typecheck, test, and build on PRs to `dev` and `main`.
   - Verify `security.yml` runs CodeQL security scan and dependency security audit.
5. Add unit test coverage in `src/__tests__/` for Convex schema definitions and environment schema validation.
6. Execute `npm run typecheck` and `npm test` to verify all tests pass.
7. Write your handoff report to `C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_m3_convex_env\handoff.md` and send a message when complete.
