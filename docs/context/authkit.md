# WorkOS AuthKit Integration — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library IDs:** `/workos/authkit-nextjs`, `/workos/authkit-session`, `/get-convex/workos-authkit`
- **Versions:** `@workos-inc/authkit-nextjs` 4.3.1; `@convex-dev/workos-authkit` 0.2.7
- **Official Source:** https://workos.com/docs/authkit
- **Decision Affected:** User authentication, SSO, MFA, session token validation, and multi-tenant organization authorization.

## Key Contracts & Implementation Patterns

1. **Authentication Provider:**
   - WorkOS AuthKit provides identity verification, SSO, social logins, and MFA support.

2. **Session Verification:**
   - `authkitProxy` uses `middlewareAuth.enabled: true`; `/operations`, `/crew`, `/customer`, and future non-allowlisted routes redirect anonymous callers to AuthKit.
   - Only the marketing pages, public estimate intake API, and `/auth/callback` are listed in `unauthenticatedPaths`.
   - The callback route uses the official `handleAuth` handler and returns authenticated users to `/operations`.

3. **Convex Identity Integration:**
   - The official Convex WorkOS component supplies authentication providers and signature-verified webhook synchronization.
   - Authorization records bind to Convex's issuer-qualified `tokenIdentifier`; `subject` is used only to match an unbound, webhook-verified WorkOS profile.
   - WorkOS roles and organization claims never create Convex grants. Active Convex memberships remain authoritative.

4. **Staff vs Customer Access Control:**
   - Staff roles (`crew_member`, `crew_lead`, `estimator`, `project_manager`, `content_editor`, `content_approver`, `admin`, `owner`) are invitation-only.
   - Customer accounts allow self-serve registration tied to customer job portals.

5. **Environment Isolation:**
   - WorkOS Client ID and API Keys are scoped separately per environment (Local, Preview, Production).
   - Webhook and action secrets are server-only and independently scoped per environment.
   - The registered `/workos/action` route receives a randomized fail-closed secret until Actions are explicitly enabled with a non-placeholder `WORKOS_ACTION_SECRET` and reviewed handlers.
