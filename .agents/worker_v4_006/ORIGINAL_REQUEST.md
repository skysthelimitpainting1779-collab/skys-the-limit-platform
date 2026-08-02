## 2026-08-01T19:08:32Z
Execute Node V4-006: Core Operational Data & Private File Storage.

### Scope & Tasks
1. Extend `convex/schema.ts` with operational data tables:
   - `users`, `organizations`, `memberships`, `roleGrants`
   - `leads`, `customers`, `properties`
   - `estimates`, `jobs`, `assignments`, `tasks`, `checklists`, `projectUpdates`
   - `documents`, `notifications`, `auditEvents`
2. Implement backend queries & mutations in `convex/` for operational entities (`convex/leads.ts`, `convex/estimates.ts`, `convex/jobs.ts`, `convex/checklists.ts`, `convex/users.ts`).
3. Implement Convex private file storage API in `convex/files.ts`:
   - `generateUploadUrl`: generates signed Convex file upload URL after role & MIME allowlist checks.
   - `getDownloadUrl`: checks user authorization and document `accessLevel` before generating download URL.
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Max size: 25MB.
4. Add unit/integration tests for operational entities and file storage security rules.
5. Create state file `.agent/state/nodes/v4-006.json` recording evidence and status `pass`.
6. Write handoff report in `.agents\worker_v4_006\handoff.md`.
