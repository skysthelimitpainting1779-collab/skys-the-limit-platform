# PR #26 Authorization Migration Runbook

## Release gate

Do not merge or deploy this branch until the independent evaluator returns
`pass`, protected-preview hostile-identity tests pass, and the owner approves
any production data mutation. This change deliberately fails closed for legacy
records that do not yet have tenant or immutable identity bindings.

## Authority boundary

- WorkOS AuthKit authenticates sessions and supplies the issuer-bound JWT.
- The official Convex WorkOS AuthKit component verifies WorkOS webhook
  signatures and synchronizes user profile data; browser profile arguments are
  never trusted.
- Convex binds users by `identity.tokenIdentifier` (issuer plus subject).
- WorkOS role or organization claims never create or elevate Convex grants.
- Convex memberships and explicit `customers.userId` links are the only app
  authorization grants.
- Public pages and portal layouts are not authorization boundaries; every
  protected Convex function enforces its own actor and resource scope.

## Preview migration sequence

1. Install the Convex component in the isolated preview, set the following as
   Convex deployment environment variables (not browser variables):
   `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, and `WORKOS_WEBHOOK_SECRET` in that
   preview only, and configure WorkOS `user.created`, `user.updated`, and
   `user.deleted` events to the preview `/workos/webhook` Convex site URL.
2. Run the component's internal `auth.backfillUsers` utility for existing
   preview WorkOS users. New user events synchronize automatically.
3. Bind each preview Convex organization to its verified WorkOS organization
   identifier through the internal `organizations.bindWorkOSOrganization`
   function.
4. Let each preview user authenticate once so `users.store` binds the canonical
   `tokenIdentifier` to the webhook-verified profile. The mutation never
   accepts profile or role data and never creates a membership.
5. Through trusted operator infrastructure, call the
   internal `users.provisionMembership` boundary with an auditable actor,
   target user, target organization, role, and status. Use this path to
   bootstrap the first owner.
6. For legacy users, verify issuer, subject, and target account out of band,
   then call `users.bindLegacyIdentity`. Do not infer identity from email.
7. Backfill every tenant-owned lead with its verified `orgId`. Unscoped legacy
   leads remain inaccessible until this is complete.
8. Link legacy customers only through the authorized `users.linkCustomer`
   workflow. Duplicate email is not evidence of ownership.
9. Exercise anonymous, two-tenant, cross-customer, cross-role, disabled-
   membership, suspended-organization, and assigned/unassigned-crew cases in
   the isolated preview deployment.

## Required evidence before release

- Exact-head `npm run verify` passes.
- Production dependency audit reports no high-severity vulnerabilities.
- All protected public Convex RPCs reject anonymous callers.
- Signed WorkOS owner claims alone cannot create a Convex owner membership.
- Protected preview denies cross-tenant and suspended-organization requests.
- Repository privacy, branch protection, independent approval, and preview
  environment isolation are confirmed separately.

## Rollback

Last known-good source revision before this hardening branch:
`47bf8ce306ba9e7fb6952afde65fdcadcbbcdd73`.

After the hardening change is committed, use
`git revert <security-hardening-commit-sha>` to create an auditable source
rollback. Reverting reopens known critical authorization paths and therefore
requires owner approval before any deployment. Production data backfills must
have a separately reviewed compensating migration; never reset or delete data
to roll them back.
