# Convex Backend & CMS Contract — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/get-convex/convex`
- **Version:** Convex 1.x
- **Official Source:** https://docs.convex.dev
- **Decision Affected:** Database schema, server functions, indexing, and CMS publication model.

## Key Contracts
1. **Typed Schema Definitions:** Use `defineSchema` and `defineTable` with explicit validators (`v.string()`, `v.number()`, `v.literal()`, `v.union()`). No `v.any()`.
2. **Indexing Rules:** Explicit indexes for all access patterns (`by_slug`, `by_status`, `by_org`, `by_user_org`, `by_lead`, `by_created_at`).
3. **Public Preloading & Projection:** Preload published CMS records in Server Components (`preloadQuery`) and return minimal public projections.
4. **Server Authorization:** Validate user identities and role grants inside `query` and `mutation` functions before reading or mutating protected data.
