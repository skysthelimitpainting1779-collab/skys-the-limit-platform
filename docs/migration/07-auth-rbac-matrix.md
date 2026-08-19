# Authentication and RBAC Matrix

## Enforcement rule

Authentication proves the caller has a valid WorkOS-backed identity. Authorization is performed in Convex functions by resolving that identity to an active local membership and verifying the record relation, assignment, or permission. Client-supplied `userId`, `orgId`, `customerId`, `crewId`, and role fields are input data only; none may establish access.

| Operation family | Anonymous | Customer | Crew | Operations | Owner/admin | Service/workflow |
|---|---:|---:|---:|---:|---:|---:|
| Read published CMS | Allow | Allow | Allow | Allow | Allow | Allow only if needed |
| Submit public estimate intake | Allow with validation/rate limits | Allow with validation/rate limits | Deny | Deny | Deny | Deny |
| Read own customer lead/estimate/job | Deny | Allow when ownership link matches | Deny unless assigned job relation exists | Allow within organization permission | Allow within organization | Only documented internal purpose |
| Read organization CRM pipeline | Deny | Deny | Deny | Allow with `crm:read` | Allow | Deny by default |
| Update lead status | Deny | Deny | Deny | Allow with `crm:write` | Allow | Narrow internal route only |
| Create/update estimate | Deny | Deny unless explicitly accepted client action is modeled | Deny | Allow with `estimate:write` | Allow | Narrow workflow only |
| Read/update assigned job | Deny | Read own only | Allow only when assigned and operation is crew-safe | Allow with `job:read`/`job:update` | Allow | Narrow workflow only |
| Assign crew | Deny | Deny | Deny | Allow with `crew:assign` | Allow | Deny by default |
| Read audit events | Deny | Only expressly shared activity view | Only assignment-scoped event view | Allow with `audit:read` and org scope | Allow | Internal only |
| Publish CMS | Deny | Deny | Deny | Allow with `cms:publish` | Allow | Deny by default |
| Manage membership/roles | Deny | Deny | Deny | Only explicit `membership:manage` if business policy permits | Allow with membership scope | Deny by default |
| Submit bid, contract, certification, or approval-required outreach | Deny | Deny | Deny | Create draft/request approval only | Explicit human approval only | Never autonomous |

## Authorization kernel interface

The implementation should expose small reusable server-only helpers. Names are illustrative; the contract is mandatory.

| Helper | Input | Required behavior |
|---|---|---|
| `requireIdentity(ctx)` | Convex context | Calls `ctx.auth.getUserIdentity()`, rejects null, and returns trusted subject/issuer/token identifier. |
| `requireUser(ctx)` | Context | Maps trusted subject to `users.externalId`; rejects unknown or disabled projections. |
| `requireMembership(ctx, orgId)` | Context and record organization | Verifies active membership; never accepts an organization from a client as proof. |
| `requirePermission(ctx, orgId, permission)` | Context, org, immutable permission | Resolves membership/permission and rejects absent privilege. |
| `requireCustomerRecord(ctx, record)` | Context and record | Verifies a server-stored customer/user/contact link, not client equality. |
| `requireCrewAssignment(ctx, job)` | Context and job | Requires active crew identity and server-stored job assignment or separate role permission. |
| `requireOwner(ctx, orgId)` | Context and org | Requires the organization owner/admin permission. |
| `writeAuditEvent(ctx, event)` | Trusted actor/event data | Appends an event using server-derived actor and organization context. |

## Role-model decision

The current `users.role` (`owner`, `staff`, `customer`, `crew`) and `memberships.role` (`owner`, `admin`, `member`) cannot both independently authorize a call. The secure target uses membership-derived permissions as the source of organization operational access. A user category can support UI segmentation or customer/crew behavior but does not replace the membership check. WorkOS role slugs and permissions may inform this mapping, but local membership status and record relationships remain checked on every protected function.[1]

## Required regression suite

| ID | Scenario | Expected server result |
|---|---|---|
| AUTH-01 | Anonymous caller invokes operational query | Throws unauthenticated error before data read. |
| AUTH-02 | Anonymous caller invokes privileged mutation | Throws unauthenticated error before write. |
| AUTH-03 | User supplies another user’s ID to read/update data | Denied; identity is derived from token. |
| AUTH-04 | Customer requests another customer’s estimate/job/lead | Denied. |
| AUTH-05 | Active member requests another organization’s record | Denied. |
| AUTH-06 | Crew user requests unassigned job | Denied. |
| AUTH-07 | Crew user changes job status outside permitted safe action | Denied. |
| AUTH-08 | Operations member acts outside organization | Denied. |
| AUTH-09 | User attempts to store themselves with `owner` role | Denied or role ignored; default safe role only. |
| AUTH-10 | Non-owner calls `users.updateRole` | Denied and no target patch occurs. |
| AUTH-11 | Owner changes role in a different organization | Denied. |
| AUTH-12 | Unprivileged member updates lead status | Denied. |
| AUTH-13 | Unprivileged member updates job status or assigns crew | Denied. |
| AUTH-14 | Unprivileged member reads audit history | Denied. |
| AUTH-15 | Public estimate intake with valid constrained input | Succeeds without granting operational access. |

## Auth bridge checks

The WorkOS AuthKit integration needs independent tests for callback handling, protected proxy paths, sign-in redirects with trusted return destinations, session configuration, client token hand-off, and Convex `auth.config.ts`. Preview environments must use development credentials and must not enable production side effects. The Next.js proxy must use the AuthKit response-header helper so session internals are not leaked to browsers.[2]

## References

[1]: https://workos.com/docs/authkit/roles-and-permissions "WorkOS roles and permissions"
[2]: https://workos.com/docs/sdks/authkit-nextjs "WorkOS AuthKit Next.js SDK"
[3]: https://docs.convex.dev/auth/functions-auth "Convex authentication in functions"
