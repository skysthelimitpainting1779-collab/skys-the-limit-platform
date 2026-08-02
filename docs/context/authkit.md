# WorkOS AuthKit Integration — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/workos/authkit-nextjs`
- **Version:** `@workos-inc/authkit-nextjs` 0.9.x
- **Official Source:** https://workos.com/docs/authkit
- **Decision Affected:** User authentication, SSO, MFA, session token validation, and multi-tenant organization authorization.

## Key Contracts & Implementation Patterns

1. **Authentication Provider:**
   - WorkOS AuthKit provides identity verification, SSO, social logins, and MFA support.

2. **Session Verification:**
   - Server-side routes and API endpoints verify the AuthKit session cookie using `@workos-inc/authkit-nextjs` helpers (`withAuth`, `getUser`).
   - `proxy.ts` guards protected paths (`/dashboard/*`, `/portal/*`, `/admin/*`).

3. **Convex Identity Integration:**
   - JWT tokens issued by AuthKit are validated in Convex via OpenID Connect configuration.
   - `ctx.auth.getUserIdentity()` extracts token claims (`subject`, `email`, `given_name`, `family_name`).

4. **Staff vs Customer Access Control:**
   - Staff roles (`crew_member`, `crew_lead`, `estimator`, `project_manager`, `content_editor`, `content_approver`, `admin`, `owner`) are invitation-only.
   - Customer accounts allow self-serve registration tied to customer job portals.

5. **Environment Isolation:**
   - WorkOS Client ID and API Keys are scoped separately per environment (Local, Preview, Production).
