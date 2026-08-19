# Data Migration Plan

## Objective and constraints

The website’s Supabase/Payload/Directus-era records are migration sources, not target architecture. The platform’s Convex schema becomes canonical only after mappings, data quality, reconciliation, security, and rollback are proven. No migration invents testimonials, projects, awards, certifications, pricing, quantities, or business claims. Dynamic agent state, worker histories, generated dumps, and Repomix exports are never product data.

## Data inventory and target mapping

| Legacy source | Target domain | Migration treatment | Reconciliation key |
|---|---|---|---|
| Supabase lead records | CRM leads, contacts, opportunities | Normalize contact attributes, retain legacy source ID and created/updated timestamps, classify duplicate candidates | Legacy primary key + canonical email/phone normalization |
| Supabase portal identity and lead association | users/customers/customer-record links | Do not infer ownership solely from matching email; require verified mapping and audit any manual resolution | Auth subject mapping + legacy account identifier |
| Payload services, service areas, portfolio, testimonials, FAQs, settings | Structured CMS records and revisions | Import only approved/published content; preserve source ID/revision/provenance; mark unverified claims for review | Legacy slug/ID + content hash |
| Payload CRM views | CRM source only | Do not recreate view architecture; extract underlying authoritative data with access-controlled export | Underlying source PK and export manifest |
| Directus content/assets | Structured CMS/media records where verified | Read-only export, asset provenance and licensing checks, map aliases/redirects | Source ID + checksum |
| Website public static content | CMS seed or approved code content | Treat as reference material; manual content review before publication | Route + content hash |
| Legacy PostgreSQL/Supabase audit-relevant events | audit events/evidence where useful | Preserve source system and timestamp; do not falsely attribute a new actor | Source system + legacy event ID |
| Agent run state/logs | None | Exclude from product migration; archive or discard under control-plane policy | Not applicable |

## Migration phases

### 1. Read-only discovery

Create a source inventory under authenticated, least-privilege credentials. Record table/collection counts, schema versions, primary keys, content states, media sizes, foreign-key relationships, RLS/view constraints, and data quality issues. Do not export secrets, service-role keys, access tokens, or sensitive customer documents to Git.

### 2. Mapping and dry run

Implement idempotent import scripts outside the request path. Each target record receives `legacySource`, `legacyId`, `importBatchId`, `importedAt`, and source checksum fields where appropriate. Dry runs write only to a disposable Convex deployment. The importer reports creates, updates, skips, duplicates, invalid records, missing relations, and unverified factual claims.

### 3. Reconciliation

Compare source and target by entity counts, source IDs, content hashes, relationship counts, and sampled record semantics. Review every exception category. Public content is checked through target routes and metadata. CRM and operations records are checked under role-specific authorization tests. Evidence records retain source location and capture time.

### 4. Cutover migration

During a planned release window, enable source write freeze or use a documented delta-capture process. Run final delta import, reconcile counts, run target acceptance tests, and keep the old system read-only for the defined rollback window. No destructive legacy deletion occurs until rollback expiration and business signoff.

## Identity and permission migration

Legacy authentication identities do not automatically become platform owners or operations members. The initial platform migration creates user projections and memberships with the least-privileged default. Owner/admin and operations assignments require a controlled, auditable provisioning decision. Customer record links are created only from verified ownership evidence. Crew assignments are imported only where the source explicitly supports them; absent data is a manual assignment task, not a guessed relationship.

## Media and documents

Every media/document import records source URI, hash, type, owner/organization, purpose, access policy, and verified-source relationship. Public images must be safe to publish and have alternative text. Customer documents default to private. Municipal documents retain their source portal, solicitation/opportunity association, retrieval time, and source span information for extracted requirements.

## Rollback plan

Convex imports are additive and batch-tagged. The importer supports a dry-run, a resume-safe idempotency mode, and a batch rollback procedure that removes only records created by the failed batch after confirming no post-import authorized edits depend on them. Production source data is never overwritten by the importer. Before any cutover, create a verified backup/export manifest for source and target, record the deployment SHAs, and retain the protected website deployment alias.

## Acceptance criteria

The migration is accepted only when all source entities have a documented disposition, counts reconcile within approved exceptions, data quality exceptions are signed off, role-specific target reads behave correctly, published content passes route/SEO checks, a clean import replay succeeds in a non-production deployment, and a batch rollback drill has been performed.
