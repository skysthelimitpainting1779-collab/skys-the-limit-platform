# Target Architecture

## Architectural decision

`skys-the-limit-platform` is the destination application. `skysthelimit-website` remains the protected production system until the destination has verified functional, visual, SEO, security, and rollback parity. The repositories are not to be wholesale-merged. The production website is a reference for verified public experience, while Convex is the canonical data and workflow backend for the unified application.

```text
Next.js 16 + shadcn/ui + Motion
            |
            v
WorkOS AuthKit session + Convex AuthKit bridge
            |
            v
Convex application functions
  |        |         |          |
  v        v         v          v
CRM       CMS    Operations  Municipal pipeline
  \        |         |          /
   \       |         |         /
    -------- Business graph ---
              |
              v
    Evidence ledger + audit history
              |
              v
  Durable, approval-aware workflows
```

## Boundary model

| Boundary | Canonical responsibility | Explicitly excluded |
|---|---|---|
| Next.js public application | Public pages, responsive UX, SEO, structured presentation, estimate intake, portals, and authenticated admin UI | Legacy Directus, Payload, client-owned administrative security, and embedded agent-control-plane state |
| WorkOS AuthKit | Authentication, sessions, organization membership source, and role/permission claims | Sole authorization decision-maker for record ownership and business state |
| Convex application layer | Identity resolution, membership lookup, authorization, CRM/CMS/operations/municipal data, public-intake validation, audit events | Trusting a client-supplied user, organization, customer, or crew identifier as proof of access |
| Convex durable components | Approved durable workflows, bounded background work, record-specific agent threads after authorization | Automatic bid submission, contract acceptance, certifications, pricing commitments, or unapproved outreach |
| Separate `skys-agent-control-plane` repository | Worktree orchestration, builders, critics, evaluators, reusable skills, provider adapters, machine review, execution graphs, and transient memory | Product runtime deployment, customer data processing, or dynamic state committed to product source repositories |
| Product repository governance | CI contracts, tests, dependency checks, security checks, deployment verification, branch rules, and repository-specific `AGENTS.md` | General-purpose orchestration history, checkpoints, worker logs, and reusable automation plugins |

## Authentication and authorization design

WorkOS AuthKit remains the selected provider. The Next.js application will establish the AuthKit session and pass a WorkOS-issued access token to Convex through the official provider bridge. `convex/auth.config.ts` will validate the WorkOS issuers and client ID. Convex functions will obtain identity using `ctx.auth.getUserIdentity()` and map the token subject to a local user plus an active organization membership. This completes authentication without confusing it with authorization.[1] [2]

> Every privileged Convex function must call a reusable server-side authorization helper before reading or writing protected records. Route guards and UI visibility are defense-in-depth only.

The initial permission vocabulary should use immutable operation-oriented slugs: `crm:read`, `crm:write`, `estimate:read`, `estimate:write`, `job:read`, `job:update`, `crew:assign`, `cms:publish`, `municipal:read`, `municipal:propose`, `audit:read`, and `membership:manage`. WorkOS organization roles can carry these permissions, but Convex must validate that the authenticated subject is associated with the local organization and that the requested record belongs to that organization. Customer and crew access additionally require record ownership or explicit assignment.

| Actor | Authorized scope | Disallowed scope |
|---|---|---|
| Anonymous | Published public content and an intentionally constrained estimate-intake command | Operational reads, privileged mutations, internal evidence, membership changes, CRM search |
| Customer | Their own leads, estimates, jobs, approved files, and communications | Other customers' records, organization administration, audit history not specifically shared |
| Crew | Explicitly assigned jobs and role-allowed operational data | Unassigned jobs, customer/organization administration, role changes |
| Operations | Organization-scoped CRM and operational activity permitted by membership permissions | Other organizations, privileged role management unless explicitly authorized |
| Owner/admin | Organization-scoped privileged operations and membership administration | Cross-organization administration without an explicit global support policy |
| Workflow/service identity | Narrowly scoped internal operations with a documented purpose and secret/credential boundary | Browser use, general end-user access, or bypassing business approval steps |

## Business graph

The platform will evolve in slices rather than create one table per noun. Identity and organization membership are prerequisites for all protected records. CRM entities use shared identities and relationships. Operations entities join to CRM records and organizations. CMS records are structured, revisioned, auditable, and only expose published material publicly. Municipal records share agencies, contractors, contacts, documents, evidence, deadlines, and activities with the same CRM graph.

| Domain | First canonical entities | Required query paths | History/provenance requirement |
|---|---|---|---|
| Identity | users, organizations, memberships, permission mapping | subject-to-user; active membership by user and organization | Membership and role transitions audited |
| CRM | contacts, companies, relationships, leads, opportunities, activities, tasks, communications | contacts by organization; lead/opportunity by customer and status | Actor, source, timestamps, state transitions |
| Operations | estimates, jobs, assignments, schedules, customers | estimate/job by organization; job by crew assignment; customer-owned records | Assignment and status transitions append audit events |
| CMS | site settings, services, service areas, projects, portfolio, testimonials, FAQs, navigation, redirects, revisions | published route data by slug; draft/preview by authorized editor | Revision author, publish action, verified-source references |
| Municipal | agencies, portals, opportunities, solicitations, documents, requirements, addenda, contractors, bid decisions, proposals, submissions, awards, outreach | opportunity by deadline/status; contractor/agency history; evidence by subject | Document spans, observed/valid times, confidence, verification, supersession |
| Evidence | sources, observations, evidence links, facts, suggestions, conflicts, extractions | evidence/facts by subject; source provenance; unresolved conflicts | Append-first fact history; no silent overwrite of meaningful assertions |

## Durable workflow and agent posture

Adoption is staged. `@convex-dev/workflow` is appropriate for idempotent, approval-aware long-running intake follow-up and municipal research flows after the authorization layer exists. It provides durable steps, retries, cancellation, progress, and replay constraints.[3] `@convex-dev/workpool` is appropriate for bounded concurrent enrichment or document processing once each action is idempotent and its external effects are controlled.[4] `@convex-dev/agent` is deferred until record-level authorization and evidence access controls are verified; persistent thread history does not replace application authorization.[5]

No workflow or agent may automatically submit bids, sign certifications, accept procurement terms, commit pricing, execute contracts, or send approval-required outreach. Such workflows stop at an audit-backed `APPROVAL_REQUIRED` state and require a named authorized human decision.

## Design-system direction

The platform uses current shadcn/ui conventions, Base UI-compatible primitives where supported, Tailwind CSS, Motion, and semantic Sky’s the Limit design tokens. The website design is the visual reference, not a component import source. A single `src/components/ui/` primitive layer will be retained; all product-area components belong under public, marketing, forms, operations, customer, crew, municipal, CMS, CRM, or providers.

## References

[1]: https://docs.convex.dev/auth/authkit/ "Convex and WorkOS AuthKit"
[2]: https://docs.convex.dev/auth/functions-auth "Convex authentication in functions"
[3]: https://www.convex.dev/components/workflow "Convex Workflow"
[4]: https://github.com/get-convex/workpool "Convex Workpool"
[5]: https://github.com/get-convex/agent "Convex Agent"
