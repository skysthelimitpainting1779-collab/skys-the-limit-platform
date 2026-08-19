# Convex Domain Model

## Modeling principle

The platform is one business graph. CRM, CMS, operations, municipal contracting, evidence, and durable work must share identities, organizations, contacts, activities, documents, permissions, and audit history. The current schema is an initial foundation, not a secure or complete domain model. Authorization is a prerequisite to exposing any operational query or mutation.

## Foundation slice

The first additive schema work keeps the existing `users`, `organizations`, and `memberships` tables but changes their usage. The authenticated WorkOS subject maps to `users.externalId`. A membership is the authoritative organization-scoped access link. The user-level category is not permission proof. The authorization helper resolves active membership once per request and derives permissions from a fixed server-side role/permission map or trusted WorkOS membership claims.

| Entity | Current status | Target responsibility | Required indexes/query paths |
|---|---|---|---|
| users | Exists | External identity projection and user profile, never caller-authorized role selection | `by_externalId` |
| organizations | Exists | Tenant/account boundary and business settings | `by_slug` |
| memberships | Exists | Active organization membership, role, and status | `by_user_org`, `by_user`, `by_org`, plus active membership query path if index needs expansion |
| auditEvents | Exists but unguarded | Append-only record of authorized actor, action, target, metadata, and correlation | target, actor, organization/time indexes in the secure slice |
| permissions | Missing | Stable permission map, initially code-defined and documented | No user-controlled mutation in first slice |

## CRM and operations model

The platform should not create disconnected lead, customer, estimate, and job applications. Contacts and companies are reusable parties. Leads capture public intake. Opportunities represent qualified work. Estimates and jobs connect to the same customer/opportunity relationship and organization. Activities, communications, notes, and tasks are shared timelines.

| Domain object | Initial relationship | Typical query | Access condition |
|---|---|---|---|
| contact | belongs to organization; may link to customer/company/agency/contractor | contacts for organization or related record | Operations by permission; customer only self-linked contact data |
| company | organization-scoped CRM party | company and related contacts/opportunities | Organization membership |
| lead | anonymous intake creates it; staff qualify it; customer link appears only after verified ownership | lead by status, email, or customer | Public create only; operational reads are organization-scoped |
| opportunity | links lead, organization, parties, and lifecycle | pipeline by organization/status | Organization membership and permission |
| estimate | links opportunity/lead, customer, organization | estimate by customer, lead, organization | Customer ownership or organization permission |
| job | links accepted estimate, organization, crew assignments | job by organization, customer, crew, status | Customer ownership, explicit crew assignment, or operations permission |
| activity/communication/task | polymorphic subject with normalized actor and organization | timeline by subject and organization | Same policy as subject plus actor-based write rule |

## CMS model

The CMS is structured rather than a generic page builder. Public pages resolve published records only. Admins create revisions, preview drafts, publish records, and create audit events through protected Convex mutations.

| Entity | Core fields | Public query path | Admin condition |
|---|---|---|---|
| siteSettings | organization/site identity, support and SEO defaults | singleton published settings | `cms:publish` for changes |
| pages | route, title, state, composition reference | published page by route | content editor role |
| pageRevisions | page ID, version, author, content snapshot, state | none | editor or publisher |
| services/serviceAreas | slug, public copy, SEO, structured attributes | published slug | editor/publisher |
| projects/portfolioItems | verified job linkage, public copy, media, publish state | published slug/list | verified-source and publisher checks |
| testimonials/faqs/navigation/redirects | structured content and state | published collections | editor/publisher |
| mediaAssets | storage reference, owner, purpose, verified-source metadata | signed/public as policy allows | editor and record relation checks |

No project, testimonial, credential, quantity, result, or award may be generated as a fallback fact. Public factual claims need a verified-source field or a direct approved authoring record.

## Municipal and subcontracting model

Municipal work is a first-class domain but must follow the identity and evidence foundations. Begin with agencies, procurement portals, contacts, municipal opportunities, solicitations, source documents, deadlines, requirements, contractors, bid decisions, proposals, submissions, awards, outreach, and follow-ups. Relationship tables such as `opportunityContractors` and shared `relationships` prevent duplicated party data.

The lifecycle is stored as explicit state transitions with actor, time, reason, evidence references, and approval state. `APPROVAL_REQUIRED` is a terminal pre-action state for pricing, contractual representation, certification, bid submission, and unapproved outreach. The system may prepare evidence-backed drafts but cannot execute those business actions automatically.

## Evidence ledger

Observations are raw ingested signals. Evidence links an observation to a source and target. Facts are claims with a verification status. Suggestions remain proposals. Conflicts are explicit competing assertions. A fact change never silently overwrites meaningful history.

| Record | Minimum attributes |
|---|---|
| sourceDocument | source type, URI/storage ID, capture time, hash/version, access scope |
| observation | subject type/ID, raw content or structured extraction, source ID, observed time, creator/process |
| evidence | observation ID, source location/span, subject link, confidence class |
| fact | subject type/ID, predicate, value, provenance, validFrom, validTo, verification status, supersedes, creator, created time |
| suggestion | proposed fact/action, rationale, evidence IDs, confidence, status |
| conflict | competing fact IDs, affected subject/predicate, state, resolver, resolution evidence |
| extraction | document, model/process version, output, review status, source spans |

## Durable work model

Workflow tables should reference business objects by ID, be started only from authorized functions, and write an audit event for every user-visible state transition. The earliest workflow candidates are lead follow-up and municipal document analysis. Workpool is only for bounded idempotent enrichment; agent threads are only introduced after evidence access policy exists.

## Index review gate

Each new table requires a documented primary query path before implementation. Indexes are added only for those paths and reviewed after representative data and access patterns exist. Broad `.collect()` scans in current public functions are not accepted for protected production searches.
