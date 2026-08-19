# Security Findings and Containment Plan

## Evidence standard

The findings below were verified against the current cloned repository heads. Historical documents guided inspection but were not accepted as proof. Severity reflects exposure, authorization impact, and whether the condition is presently reachable in production.

| ID | Repository | Finding | Evidence | Severity | Containment objective |
|---|---|---|---|---:|---|
| WEB-P0-01 | Website | Legacy `/manage` is server-side unprotected and publicly renders an operator console | Live unauthenticated route; `src/proxy.ts` matcher excludes `/manage` | P0 | Deny or replace the route at the server boundary, retaining no public admin surface. |
| WEB-P0-02 | Website | The route exposes browser-side owner registration | `src/app/manage/page.tsx` calls `supabase.auth.signUp` from `handleSignupOwner` | P0 | Remove the capability and test that it cannot reappear. |
| WEB-P0-03 | Website | Administrative tables are open to all authenticated Supabase users | `20260623000000_settings_and_admin_schemas.sql` uses `TO authenticated USING (true) WITH CHECK (true)` | P0 | Replace broad grants and policies with an explicit administrative authorization model; test allowed and denied cases. |
| WEB-P0-04 | Website | Runtime configuration has unsafe placeholder fallbacks | `src/payload.config.ts`; `src/lib/supabase/client.ts`; `src/lib/supabase/server.ts` | P0 | Require relevant secrets/connection variables and fail closed outside explicit local test configuration. |
| WEB-P1-05 | Website | Payload access assumes `req.user` is sufficient; backing views require security review | `src/collections/payload/Admins.ts`; `src/payload.config.ts`; payload migrations | P1 | Define role-aware Payload access and prove view/grant behavior with a clean database test. |
| PLAT-P0-01 | Platform | Auth is selected but not active in the runtime | No `convex/auth.config.ts`, no WorkOS package/provider, no `ctx.auth.getUserIdentity()` in application code | P0 | Install and configure the selected provider before operational routes are enabled. |
| PLAT-P0-02 | Platform | Caller can self-assign or change privileged roles | `convex/users.ts` `store` accepts `role`; `updateRole` has no actor check | P0 | Separate identity synchronization from role administration; require an authorized owner membership. |
| PLAT-P0-03 | Platform | Protected data and mutations are publicly callable | `convex/leads.ts`, `estimates.ts`, `jobs.ts`, `auditEvents.ts` lack identity and ownership checks | P0 | Implement common authorization helpers and test anonymous, cross-org, cross-customer, and crew-assignment denials. |
| PLAT-P1-04 | Platform | CI workflow uses mutable action tags and package lifecycle scripts | `.github/workflows/ci.yml` | P1 | Port immutable action pinning and `npm ci --ignore-scripts` after validation of build compatibility. |
| PLAT-P1-05 | Platform | Product repository contains dynamic agent state and duplicate skills | `.agent/state/**`, `.agents/**`, `.claude/**`, `graphify-out/graph.json` | P1 | Extract reusable source to control plane and remove/ignore state only after reference analysis. |

## P0 remediation order

The website P0 surface is already publicly exposed, so its containment slice is first. The platform is not a replacement yet and should not be made public for operations until authentication and authorization are in place. The platform P0 authorization slice begins with tests and an authorization kernel, not with broad domain-table expansion.

| Sequence | Slice | Prerequisite | Safe completion condition |
|---:|---|---|---|
| 1 | Website legacy admin containment | Node 24/npm 11 verification environment; testable source baseline | `/manage` does not expose owner initialization or Supabase administrative CRUD to unauthenticated traffic; required runtime config fails closed. |
| 2 | Website RLS/view hardening | Local Supabase test environment or disposable database | Policies and grants deny non-admin users; view behavior is explicitly verified; clean migration replay succeeds. |
| 3 | Platform WorkOS/Convex auth bridge | WorkOS development client ID and non-production secure cookie secret | AuthKit session reaches Convex; missing/invalid identity causes protected functions to deny. |
| 4 | Platform authorization kernel | Auth bridge and test harness | Owner, organization, customer, crew, and service-boundary tests pass. |
| 5 | Platform function migration | Authorization kernel | Every existing non-public Convex function applies the relevant helper; public estimate intake remains intentionally constrained. |

## Test-first requirements

The first P0 tests must demonstrate these failures on the unmodified source and pass after the corresponding change:

| Test suite | Failing behavior to prove | Passing behavior to require |
|---|---|---|
| Website management containment | `/manage` source or route contract exposes `Init Owner` and browser-side `signUp` | No owner bootstrap exists, and the route has an explicit server-side protected/retired contract. |
| Website config contract | Payload/Supabase sources contain production placeholder fallback values | Required configuration is validated and unsafe fallback literals are absent from production client/server construction. |
| Website database policy test | A generic authenticated identity can read/write admin resources | A non-admin authenticated identity is denied, an admin identity is granted only the needed action, and public reads remain narrowly scoped. |
| Platform auth/RBAC | Anonymous caller can list/update protected data or patch a role | Protected calls throw before a data read/write; approved owner/operator calls remain narrowly scoped. |
| Platform isolation | A customer can use a foreign record ID, a crew member can access an unassigned job, or a member crosses organization boundaries | Every such call is denied regardless of client-supplied identifiers. |

## Database remediation constraints

Supabase applies both grants and RLS policies. Policies do not revoke default privileges, and views can bypass underlying RLS unless explicitly configured or protected. The database slice must therefore inspect grants, view ownership, `security_invoker` support, and the clean migration chain rather than merely replacing permissive policy text.[1]

Service-role credentials remain server-only and may bypass RLS only in tightly scoped route handlers. Browser code must never receive service credentials. The platform will not inherit this architecture; Convex functions own its authorization boundary.

## Verification evidence required for closure

P0 closure requires source tests, full existing CI, a clean install on the declared runtime, static diff checks, hosted checks, and a targeted unauthenticated production verification following deployment. The RLS and migration findings cannot be marked complete without a repeatable database test run. Any missing WorkOS, Convex, Supabase, or Vercel credentials are external blockers and must be recorded rather than substituted with placeholders.

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase row-level security"
[2]: https://docs.convex.dev/auth/functions-auth "Convex authentication in functions"
[3]: https://workos.com/docs/sdks/authkit-nextjs "WorkOS AuthKit Next.js SDK"
