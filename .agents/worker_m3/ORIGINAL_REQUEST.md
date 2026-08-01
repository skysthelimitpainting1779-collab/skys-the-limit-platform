## 2026-08-01T19:33:16Z
You are a Worker subagent (working directory: C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_m3).
Your task is to execute Milestone 3: Wire Convex backend endpoints to Next.js 16 app shells (`/estimate`, `/customer`, `/crew`, `/operations`).

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Specific instructions:
1. Initialize working directory C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_m3 with BRIEFING.md and progress.md.
2. Perform Context7 research for `convex/react` and Next.js 16 Client Component patterns (using `resolve-library-id` + `query-docs`).
3. Examine existing app shell routes:
   - `src/app/estimate/page.tsx` & `src/components/estimate/EstimateForm.tsx` (wire to `api.estimates.create` / `api.leads.create`)
   - `src/app/customer/page.tsx` (wire customer portal dashboard to `api.estimates.listByLead`, `api.jobs.list`)
   - `src/app/crew/page.tsx` (wire crew portal to `api.jobs.list`, `api.jobs.updateStatus`)
   - `src/app/operations/page.tsx` (wire operations dashboard to `api.leads.list`, `api.jobs.list`, `api.auditEvents.listRecent`)
4. Ensure Convex React provider (`ConvexProvider` / `ConvexClientProvider` in `src/components/providers/ConvexClientProvider.tsx`) is properly established for client components with fallback / sandbox handling when environment variables are unset.
5. Enhance UI pages with motion primitives (`src/design/motion/`) and proper loading / empty / submission states without breaking existing WCAG reduced-motion or styling rules (`motion/react` only).
6. Create or update unit/component test suites in `src/__tests__/` to verify app shell wiring and Convex integration.
7. Run `npm test` and `npm run typecheck` (`npm run verify:branch`) to confirm clean pass.
8. Write `changes.md` and `handoff.md` in your working directory.
9. Message the orchestrator (conversation ID: cd97b26a-6d33-46ea-8a37-fdbc6cbd4387, Recipient: parent) with a summary of changes and handoff path.
