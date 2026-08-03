# Authentication Contract — Context7 Research Record

- **Research Date:** 2026-08-02
- **Decision Affected:** User identity verification, portal session management, and server-side role resolution.

## Key Contracts
1. **Convex Identity Integration:** Use `ctx.auth.getUserIdentity()` to verify authentication status on all protected functions.
2. **Identity Binding:** Map the issuer-bound `identity.tokenIdentifier` to the
   application user. Keep `identity.subject` and email as profile attributes;
   neither is globally unique enough to authorize access.
3. **Verified Profile Sync:** Use the official `@convex-dev/workos-authkit`
   component and its signature-verified `/workos/webhook` route to synchronize
   WorkOS user profiles. A standard AuthKit access token does not carry email,
   name, or profile-picture claims. First login may bind `tokenIdentifier` only
   to a webhook-synchronized profile for the same WorkOS subject.
4. **Role Grants:** WorkOS authenticates the principal, but WorkOS session role
   claims do not create Convex grants. Provision memberships through an
   internal operator/webhook boundary or an authorized existing Convex owner,
   then authorize every protected resource from an active Convex membership on
   an active organization. The deployment-wide user role is not a grant.
5. **Customer Binding:** Customer ownership requires an explicit
   `customers.userId` link created by an authorized administrator. Email never
   claims an unlinked customer at read time.
6. **Deny-by-Default:** Reject unauthenticated, unprovisioned, inactive, or
   unauthorized calls with explicit error messages.
