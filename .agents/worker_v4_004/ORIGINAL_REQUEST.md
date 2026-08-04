## 2026-08-01T19:08:29Z

Execute Node V4-004: Claims & Proof Governance System.

### Scope & Tasks
1. Implement the `claims` table in `convex/schema.ts` (claimId, claimText, category, verificationStatus: "unverified" | "verified" | "rejected", proofAssetIds, approvedBy, verifiedAt, notes).
2. Implement backend functions in `convex/claims.ts` (create claim, update status, query claims by category/status).
3. Implement CMS publication gate function (`convex/cms/gates.ts` or `convex/cmsGates.ts`) that validates CMS section/page content before publishing:
   - Rejects publication if content references unverified claims.
   - Rejects unverified superlatives ("best", "#1", "100%") unless backed by a verified `claims` record.
4. Add unit/integration test coverage for claim verification and publication gate behavior.
5. Create state file `.agent/state/nodes/v4-004.json` recording evidence and status `pass`.
6. Write handoff report in `.agents\worker_v4_004\handoff.md`.
