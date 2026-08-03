# Authorization Matrix — Sky's Signature Platform V3

| Resource / Action | Anonymous | Customer | Crew Member | Crew Lead | Estimator | Project Manager | Content Editor | Content Approver | Admin / Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Public Published CMS Pages** | READ | READ | READ | READ | READ | READ | READ | READ | READ |
| **Draft / In-Review CMS Pages** | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | READ / EDIT | READ / EDIT | FULL |
| **CMS Publishing / Unpublishing** | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | APPROVE/PUB | FULL |
| **Candidate Assets Access** | PREVIEW ONLY | PREVIEW ONLY | PREVIEW ONLY | PREVIEW ONLY | PREVIEW ONLY | PREVIEW ONLY | READ | READ / EDIT | FULL |
| **Lead Intake Creation** | CREATE | CREATE | CREATE | CREATE | CREATE | CREATE | CREATE | CREATE | FULL |
| **Leads Directory & Management** | DENIED | DENIED | DENIED | DENIED | READ / EDIT | FULL | DENIED | DENIED | FULL |
| **Estimates Creation & Versioning** | DENIED | DENIED | DENIED | DENIED | CREATE / EDIT | FULL | DENIED | DENIED | FULL |
| **Customer-Owned Estimates** | DENIED | READ OWN | DENIED | DENIED | READ / EDIT | FULL | DENIED | DENIED | FULL |
| **Customer-Owned Projects & Documents** | DENIED | READ OWN | DENIED | DENIED | READ / EDIT | FULL | DENIED | DENIED | FULL |
| **Assigned Jobs & Tasks** | DENIED | DENIED | READ / UPDATE | READ / UPDATE | DENIED | FULL | DENIED | DENIED | FULL |
| **Unassigned Jobs / Other Customers** | DENIED | DENIED | DENIED | DENIED | DENIED | FULL | DENIED | DENIED | FULL |
| **Financial / Margin Data** | DENIED | DENIED | DENIED | DENIED | READ ESTIMATE | FULL | DENIED | DENIED | FULL |
| **Audit Events Log** | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | READ ONLY (APPEND ONLY) |

---

## Authorization Enforcement Rules
1. **Server-Side Authorization:** Every protected Convex query and mutation must validate `ctx.auth` or membership roles on the server. Client-side checks are UI hints only.
2. **Organization Isolation:** Operations queries filter strictly by `orgId`. Multi-tenant crosstalk is strictly prohibited.
3. **Customer Isolation:** Customers can only query `estimates`, `jobs`, or
   `documents` linked through an explicit `customers.userId` binding to the
   issuer-bound authenticated identity. Email is display/contact data and never
   an ownership key.
4. **Crew Isolation:** Crew members can only query jobs and checklists where their `userId` is present in `job.crewIds`.
5. **CMS Approval Flow:** Content editors can create `draft` or `in_review` revisions. Only `content_approver`, `admin`, or `owner` can set `status: "published"`.
6. **WorkOS Binding:** Convex user lookups use `identity.tokenIdentifier`
   (issuer + subject). WorkOS session claims never create or elevate Convex
   memberships. Memberships are provisioned through an internal operator or
   verified-webhook boundary and each request is authorized from the active
   Convex membership and active organization state.
