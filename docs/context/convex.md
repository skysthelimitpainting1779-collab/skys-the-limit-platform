# Convex Backend Architecture — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/get-convex/convex`
- **Version:** Convex 1.42.x
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
