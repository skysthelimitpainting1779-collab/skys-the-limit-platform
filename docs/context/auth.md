# Authentication Contract — Context7 Research Record

- **Research Date:** 2026-08-02
- **Decision Affected:** User identity verification, portal session management, and server-side role resolution.

## Key Contracts
1. **Convex Identity Integration:** Use `ctx.auth.getUserIdentity()` to verify authentication status on all protected functions.
2. **Role Grants:** Map `identity.subject` (externalId) to `users` table record and query `memberships` table for organization-scoped role.
3. **Deny-by-Default:** Reject unauthenticated or unauthorized calls with explicit error messages.
