# Graphify evidence

Query:

> Trace the estimate submission route through validation and the authoritative
> Convex lead mutation. Return exact files, symbols, callers, callees, and
> affected tests for a runtime-neutral architecture note.

Graphify 0.9.43 returned the following relevant nodes and extracted edges:

- `src/app/api/estimate/route.ts`: `runtime`
- `convex/leadActions.ts`: `submit`
- `convex/leads.ts`: `create` and `resolveOrganizationIdByWorkOSId`
- `convex/lib/leadValidation.ts`: `assertLeadMutationInput` and
  `normalizeLeadMutationInput`
- `src/__tests__/convex-lead-validation.test.ts`
- `src/__tests__/routes.test.ts`
- `create -> normalizeLeadMutationInput`
- `create -> appendAuditEvent`
- `normalizeLeadMutationInput -> assertLeadMutationInput`

Direct inspection of the surfaced route showed the intermediate exact files
`src/lib/leads/submit.ts` and `src/lib/leads/intakeProof.ts`, and the exact
Convex target `leadActions.submit`. Direct inspection of those targets
confirmed the complete path recorded in the candidate note.

Graph state at discovery: 9,939 nodes, 19,870 edges, 613 communities, worktree
local, with zero tracked source paths since the latest build marker.

