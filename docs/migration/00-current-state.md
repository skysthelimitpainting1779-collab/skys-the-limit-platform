# Current-State Baseline

**Recorded:** 2026-08-19 PDT  
**Scope:** `skysthelimit-website` production repository and `skys-the-limit-platform` destination repository.

## Verified repository heads

| Repository | Remote default branch | Verified commit | Working tree at clone | Declared runtime | Deployment configuration |
|---|---|---|---|---|---|
| `skysthelimitpainting1779-collab/skysthelimit-website` | `main` | `92a2bee8ecacc3a803767b5cd36ca25f3fd9a4dd` | Clean | Node `24.x` | Next.js on Vercel; production origin is `https://www.skysthelimitpaintingllc.com` |
| `skysthelimitpainting1779-collab/skys-the-limit-platform` | `main` | `77c76ae1441f3e22a04b9f08306f98b1d502bf4b` | Clean | Node `>=24`, npm `>=11` | Next.js on Vercel with a Convex client endpoint |

The audit environment had Node `v22.13.0` and npm `10.9.2`, so application installation and verification are blocked until the repository-declared Node 24/npm 11 toolchain is available. This is an environment constraint, not evidence of an application failure.

## Production website observations

The public marketing site is live at the canonical `www` origin and exposes residential, commercial, public-sector, project, service-area, about, and estimate-intake surfaces. The public design, branding, conversion UX, SEO routes, assets, and hardened CI concepts remain valuable source material for the platform migration.

The legacy `/manage` route is also live and returns an unauthenticated operator-login screen that includes an **Init Owner** control. No credentials were submitted and no owner initialization was attempted. Source inspection shows that the route is a client-side Supabase console and that the request proxy matcher protects `/portal` but does not include `/manage`.

> The current production management route is not server-side denied before it renders its administrative interface. It is therefore a P0 containment target, independent of the longer-term platform migration.

| Finding | Evidence | Severity | Required disposition |
|---|---|---:|---|
| Public legacy management surface | Production `/manage`; `src/app/manage/page.tsx`; `src/proxy.ts` | P0 | Remove owner bootstrap and block or replace the legacy route server-side before migration proceeds. |
| Browser-visible owner registration | `handleSignupOwner` calls `supabase.auth.signUp` in `src/app/manage/page.tsx` | P0 | Delete the public owner-initialization path. Provision administrators through a controlled out-of-band process. |
| Broad administrative RLS | `20260623000000_settings_and_admin_schemas.sql` grants authenticated `USING (true)` and `WITH CHECK (true)` access | P0 | Replace with deny-by-default grants and a server-verifiable administrative identity model; add database policy tests. |
| Fail-open secret and DB configuration | `src/payload.config.ts` supplies Payload and database placeholders; Supabase clients supply dummy values | P0 | Validate required production configuration at boot and fail closed. |
| Unverified view security | Payload uses `payload-schema` views over public CRM data | P1 | Verify view ownership, grants, and `security_invoker`/unexposed-schema behavior in a reproducible database test. |
| Production code contains multiple legacy CMS/data stacks | Directus, Payload, and Supabase administrative code remain present | P1 | Preserve public functionality while migrating; do not transplant these stacks into the platform. |

## Platform observations

The platform has a coherent initial Convex schema for users, organizations, memberships, leads, estimates, jobs, and audit events. Its public estimate-intake mutation already validates inputs, records server timestamps, enforces idempotency, and applies a bounded per-email/per-phone rate limit. That public mutation is a sound starting point but must be protected by additional anti-abuse controls before the final cutover.

The selected identity architecture is WorkOS AuthKit with Convex. Current runtime code, however, does not include `convex/auth.config.ts`, a WorkOS package, or a WorkOS/Convex provider bridge. No application `ctx.auth.getUserIdentity()` usage was found. The current public Convex functions accept client-supplied record identifiers and expose unguarded reads and writes across users, leads, estimates, jobs, and audit events. `users.store` accepts a caller-provided role, and `users.updateRole` patches roles without checking an authenticated caller or organization membership.

| Finding | Evidence | Severity | Required disposition |
|---|---|---:|---|
| No active WorkOS/Convex auth configuration | Missing `convex/auth.config.ts`; no WorkOS package or provider integration | P0 | Implement the chosen WorkOS AuthKit/Convex integration before making operational routes available. |
| Unauthenticated privilege escalation | `convex/users.ts` `store` and `updateRole` | P0 | Derive actor identity server-side; prohibit caller-selected privileged roles and require owner-authorized membership administration. |
| Unauthenticated cross-record access | `convex/leads.ts`, `estimates.ts`, `jobs.ts`, `auditEvents.ts` lack identity and organization checks | P0 | Establish reusable authorization helpers, then protect every non-public Convex function with record and organization checks. |
| User-role and membership-role mismatch | `users.role` and `memberships.role` model different concepts without enforcement | P1 | Make organization membership and permissions authoritative for operational access; retain user category only where it has a documented product purpose. |
| Committed control-plane state in product repo | `.agent/state/**`, `.agents/**`, `.claude/**`, `graphify-out/graph.json` | P1 | Extract reusable automation definitions to a separate control-plane repository and stop tracking dynamic state in product repositories. |
| Platform governance gap | No remote ruleset; workflow actions are not consistently SHA-pinned; no CI authorization gate | P1 | Port only the verified website governance invariants after the authorization baseline is green. |

## Governance baseline

The website has an active remote ruleset named **Main governed lifecycle**. The platform has no remote ruleset at the time of inspection. The website CI uses `npm ci --ignore-scripts`, a repository contract gate, immutable action pins, markdown linting, tests, and deployment checks. The platform CI currently has lint, typecheck, tests, and build, but its `ci.yml` uses mutable action tags and its security audit installs with lifecycle scripts.

## Sources and limits

This baseline derives from the live remote repository heads, source inspection, the unauthenticated production route observation, and the supplied snapshots. Historical audit content was treated as a lead, not as proof. The browser observation establishes public reachability but cannot prove database policy behavior, deployed environment secrets, or deployment-to-commit correspondence. Those require the migration tests and deployment credentials identified in `VERIFICATION.md`.

## References

[1]: https://github.com/skysthelimitpainting1779-collab/skysthelimit-website "Production website repository"
[2]: https://github.com/skysthelimitpainting1779-collab/skys-the-limit-platform "Destination platform repository"
[3]: https://docs.convex.dev/auth/functions-auth "Convex authentication in functions"
[4]: https://docs.convex.dev/auth/authkit/ "Convex and WorkOS AuthKit"
[5]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase row-level security"
