# Authorization Matrix Specification — Sky's the Limit Platform

- **Document Version:** 1.0.0
- **Last Updated:** 2026-08-02
- **Scope:** Multi-Tenant Role-Based Access Control (RBAC) & Attribute-Based Access Control (ABAC) across all system domains.
- **Enforcement Layer:** Convex Backend Functions (`convex/_generated/server`) + WorkOS AuthKit Session Claims.

---

## 1. Executive Architecture

The Sky's the Limit platform implements a **Deny-by-Default** security architecture. Every API route, Convex query, mutation, and file storage request must explicitly resolve the actor's session identity and grant authorization prior to executing business logic.

- **Identity Authentication:** WorkOS AuthKit handles identity credentials, MFA, and SSO issuing JWT tokens.
- **Role Authority:** Roles are managed in Convex (`users` and `memberships` tables) tied to organization context.
- **Access Control Model:**
  - **RBAC (Role-Based Access Control):** Broad domain permissions based on assigned role.
  - **ABAC (Attribute-Based Access Control):** Object-level scoping (e.g. Customer can only access their own jobs/claims; Crew Lead can only edit assigned active jobs).

---

## 2. Roles Overview

The platform defines **10 Granular System Roles**:

1. **`anonymous`**: Unauthenticated public visitors browsing marketing pages and submitting lead intake forms.
2. **`customer`**: Property owners with authenticated access to their job status, claims, invoices, and site photos.
3. **`crew_member`**: Field staff viewing daily schedules, task checklists, and uploading job site progress photos.
4. **`crew_lead`**: Foremen managing field crew assignments, daily logs, material usage, and customer sign-offs.
5. **`estimator`**: Sales & estimating personnel creating project quotes, storm damage assessments, and scope estimates.
6. **`project_manager`**: Operational managers overseeing multi-site project schedules, crew allocation, and job execution.
7. **`content_editor`**: Marketing creators drafting CMS content, blog posts, case studies, and service offerings.
8. **`content_approver`**: Marketing leads reviewing, approving, and publishing CMS content to the live public site.
9. **`admin`**: System administrators managing user onboarding, role assignments, system config, and domain settings.
10. **`owner`**: Platform executive/owner with unrestricted root authority over financial data, audit logs, and organization settings.

---

## 3. Comprehensive Domain Authorization Matrix

Legend:
- `—` : No Access (Access Denied)
- `R` : Read / View
- `C` : Create / Draft
- `U` : Update / Edit
- `D` : Delete / Soft-Delete
- `P` : Approve / Publish
- `A` : Admin / Full Control (Manage permissions, audit, override)
- `*` : Scoped strictly to owned/assigned entities (ABAC)

| Domain | Anonymous | Customer | Crew Member | Crew Lead | Estimator | Project Manager | Content Editor | Content Approver | Admin | Owner |
|---|---|---|---|---|---|---|---|---|---|---|
| **1. CMS** | | | | | | | | | | |
| - Public Pages / Articles | R | R | R | R | R | R | R | R | R | R |
| - Draft Content | — | — | — | — | — | — | C, R, U | C, R, U | C, R, U, D | C, R, U, D, A |
| - Publish / Unpublish | — | — | — | — | — | — | — | P, R, U | P, R, U, D | P, R, U, D, A |
| - Brand Assets | R | R | R | R | R | R | C, R, U | C, R, U, P | C, R, U, D | C, R, U, D, A |
| **2. Claims** | | | | | | | | | | |
| - Own Claims | — | R, C* | — | — | — | — | — | — | R, U, D | R, U, D, A |
| - All Claims | — | — | — | — | R, C, U | R, C, U | — | — | R, C, U, D | R, C, U, D, A |
| - Adjuster Reports | — | R* | — | — | R, C, U | R, C, U | — | — | R, C, U, D | R, C, U, D, A |
| - Approval / Sign-off | — | U* (Accept) | — | — | R, U | R, U, P | — | — | R, U, P | R, U, P, A |
| **3. Operational Data** | | | | | | | | | | |
| - Lead Intake Submission | C | C | — | — | — | — | — | — | R, U, D | R, U, D, A |
| - Leads Management | — | — | — | — | R, C, U | R, C, U | — | — | R, C, U, D | R, C, U, D, A |
| - Estimates & Quotes | — | R* | — | — | R, C, U | R, C, U | — | — | R, C, U, D | R, C, U, D, A |
| - Job Schedules / Tasks | — | R* | R* | R*, U* | R | R, C, U, D | — | — | R, C, U, D | R, C, U, D, A |
| - Material / Inventory | — | — | R | R, C, U | R | R, C, U, D | — | — | R, C, U, D | R, C, U, D, A |
| **4. Files** | | | | | | | | | | |
| - Public Site Assets | R | R | R | R | R | R | R, C, U | R, C, U, D | R, C, U, D | R, C, U, D, A |
| - Job Photos (Upload) | — | C* | C* | C*, U* | C, U | C, U | — | — | C, U, D | C, U, D, A |
| - Contracts & Invoices | — | R* | — | — | R | R, C, U | — | — | R, C, U, D | R, C, U, D, A |
| - Sensitive Business Files | — | — | — | — | — | — | — | — | R, U | R, C, U, D, A |
| **5. Audit** | | | | | | | | | | |
| - View Audit Logs | — | — | — | — | — | — | — | — | R | R, A |
| - System Config / Roles | — | — | — | — | — | — | — | — | R, U | R, U, A |
| - Financial Reports | — | — | — | — | — | R (Limited) | — | — | R | R, C, U, D, A |

---

## 4. Domain-Specific Rule Definitions

### 4.1 CMS Domain Rules
- **Public Access:** Published content is accessible to all users including `anonymous`.
- **Editor Isolation:** `content_editor` can create and edit draft posts and testimonials, but cannot publish directly.
- **Approver Pipeline:** Only `content_approver`, `admin`, or `owner` can flip `status` from `draft`/`in_review` to `published`.

### 4.2 Claims Domain Rules
- **Customer Isolation (ABAC):** `customer` accounts can only access claims matching their `userId` or `propertyId`.
- **Estimator & PM Authority:** `estimator` and `project_manager` can create storm damage reports and attach adjuster notes.
- **Settlement Approvals:** Formal settlement acceptances require customer electronic sign-off (`customer` update) or manager approval (`project_manager`/`admin`/`owner`).

### 4.3 Operational Data Domain Rules
- **Lead Capture:** `anonymous` users can call `leads:submit` mutation; all other lead management queries require `estimator`, `project_manager`, `admin`, or `owner`.
- **Field Crew Scoping:** `crew_member` can view assigned daily jobs; `crew_lead` can update task completion status and log hours/materials for their assigned crew.
- **Project Scheduling:** `project_manager` has full scheduling control over crew assignments and project timelines.

### 4.4 Files Domain Rules
- **Storage Scoping:** Vercel Blob / Storage uploads require session verification.
- **Private vs Public Buckets:** Job site damage photos and invoice attachments are stored in private storage with signed URL access; public assets reside in CDN storage.

### 4.5 Audit Domain Rules
- **Immutable Log Enforcement:** `auditEvents` table in Convex is insert-only. No role (including `owner`) can mutate or delete past audit logs.
- **Log Visibility:** Only `admin` and `owner` roles can query audit event streams.

---

## 5. Convex Authorization Guard Patterns

```typescript
import { QueryCtx, MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

export type Role =
  | "anonymous"
  | "customer"
  | "crew_member"
  | "crew_lead"
  | "estimator"
  | "project_manager"
  | "content_editor"
  | "content_approver"
  | "admin"
  | "owner";

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Authentication required" });
  }
  return identity;
}

export async function requireOrganizationRole(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
  allowedRoles: Role[],
) {
  const identity = await requireAuth(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({ code: "FORBIDDEN", message: "User not provisioned" });
  }
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_org", (q) => q.eq("userId", user._id).eq("orgId", orgId))
    .unique();
  const organization = await ctx.db.get(orgId);

  if (
    !membership ||
    membership.status !== "active" ||
    organization?.status !== "active" ||
    !allowedRoles.includes(membership.role as Role)
  ) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Insufficient role permissions" });
  }
  return { identity, user, membership, organization };
}
```
