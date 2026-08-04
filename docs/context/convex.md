# Convex Backend Architecture — Context7 Research Record

- **Research Date:** 2026-08-03
- **Library ID:** `/websites/convex_dev`
- **Version:** Convex 1.43.x (project dependency; guidance applies to 1.41+)
- **Official Source:** https://docs.convex.dev
- **Decision Affected:** Backend data persistence, server functions, real-time sync, and index definitions.

## Key Contracts & Implementation Patterns

1. **Operational Truth:**
   - Convex is the sole source of truth for operational business data, state management, and real-time subscriptions.

2. **Validation & Strict Typing:**
   - Every query, mutation, and action explicitly declares argument and return validators using Convex `v` validator schemas.

3. **Authentication & Identity Integration:**
   - All protected server functions call `ctx.auth.getUserIdentity()` to extract identity claims.
   - User identity subject (`externalId`) maps to `users` and `memberships` tables for role verification.

4. **Database Indexing & Idempotency:**
   - Use composite indexes (e.g. `by_email_created`, `by_external_id`, `by_org_and_role`) for performance.
   - Transactional mutations enforce idempotency keys on mutations like lead intake and estimate generation.

5. **Server Timestamps:**
   - Server mutations generate authoritative timestamps rather than trusting client-provided timestamps.

6. **Customer Document Reads:**
   - Customer identity is derived from `ctx.auth.getUserIdentity()` and resolved through the server-side user, active membership, and exact customer-record binding.
   - Customer-visible project files use the distinct `customer` access level. They are not `public`, and the generic document metadata/list/download functions reject or cannot accept that access class.
   - Only operations staff may create `customer` documents, and each upload must reference a same-organization job with an exact customer record.
   - Customer document lists use `paginationOptsValidator`, an indexed organization/access-level read, a maximum requested page size of 50, and fail closed if a reactive page grows past that bound.
   - Specialized customer query results expose metadata only; Blob URLs and pathnames remain inside exact-bound internal queries and actions.
