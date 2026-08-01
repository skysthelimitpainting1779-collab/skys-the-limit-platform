## 2026-08-01T11:13:53-07:00

You are Reviewer 2 (`reviewer_m3_convex_env`), an independent evaluator agent for node `node-m3-convex-env` on Sky's the Limit Platform Foundation setup.
Working directory: C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\reviewer_m3_convex_env\

Per AGENTS.md §0 (Mandatory Peer Review Protocol), you MUST independently evaluate the implementation of `node-m3-convex-env` submitted by Worker 2.

Your Evaluation Duties:
1. Inspect `convex/schema.ts`:
   - Verify all 7 core tables exist: `users`, `organizations`, `memberships`, `leads`, `estimates`, `jobs`, `auditEvents`.
   - Verify indexes: `by_externalId` on `users`, `by_slug` on `organizations`, `by_user_org` on `memberships`, `by_status` on `leads`, `by_lead` & `by_org` on `estimates`, `by_org` & `by_status` on `jobs`, `by_target` & `by_actor` on `auditEvents`.
2. Inspect `src/lib/environment/schema.ts` & `.env.example`:
   - Verify preview isolation safety checks (preventing production credentials/mutations in preview).
   - Verify `.env.example` contains placeholders with no committed secrets.
3. Inspect `.github/workflows/ci.yml` and `.github/workflows/security.yml`.
4. Run focused verification:
   - Run `npm run typecheck`
   - Run `npm test`
5. Record your evaluation verdict (`pass`, `remediate`, `human_review`, or `rollback`) and full evidence log to:
   `C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agent\state\nodes\node-m3-convex-env.json`
6. Write your detailed evaluation handoff report to `C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\reviewer_m3_convex_env\handoff.md` and send a message with your verdict.
