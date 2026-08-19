# Cutover and Rollback Plan

## Release objective

The public website remains the protected production system until the platform has verified security, feature, SEO, visual, accessibility, data, and operational parity. Cutover is a controlled routing and deployment decision, not a repository merge. The legacy repository is not archived until the rollback window closes and the platform has demonstrated stable operation.

## Entry criteria

| Area | Required evidence |
|---|---|
| Website containment | `/manage` P0 remediation deployed and unauthenticated verification recorded. |
| Platform identity | WorkOS AuthKit/Convex integration works in non-production and production with separate configuration. |
| Authorization | All matrix tests pass: anonymous denial, cross-org denial, cross-customer denial, crew assignment restrictions, role-escalation denial, and audit access restrictions. |
| Public experience | Route inventory complete; critical routes have desktop/tablet/mobile visual comparison, accessibility, metadata, and interaction evidence. |
| Estimate intake | Public intake has validation, payload limits, idempotency, abuse controls, consent/UTM capture, durable follow-up boundary, and E2E proof. |
| CMS/data | Structured content imports reconcile; only approved verified public claims publish; legacy source mapping and exception report complete. |
| Governance | Required CI, dependency/security checks, immutable workflow contract, Convex validation, preview verification, and production smoke check are green. |
| Operations | Authenticated CRM/operations/customer/crew paths have role-specific E2E coverage and support runbooks. |
| Recovery | Deployment rollback and data-import batch rollback rehearsed successfully. |

## Release stages

### Stage A — non-production foundation

Deploy the platform to a preview/non-production environment with development WorkOS and Convex configuration. Run full automated verification, security tests, preview smoke tests, route checks, and limited authorized exploratory testing. Production website traffic is unchanged.

### Stage B — shadow and reconciliation

Where feasible, direct only internal, approved users to the platform. Reconcile imported data and compare public route output. Keep legacy writes authoritative until the documented delta strategy is ready. Fix parity defects in small slices; do not use production traffic as an authorization test.

### Stage C — cutover readiness decision

Create a release record with source and target commit SHAs, Vercel deployment URLs, Convex deployment identifiers, WorkOS environment IDs, data-import batch IDs, completed verification entries, known exceptions, named approvers for business-impacting decisions, and rollback trigger owners. The decision must state the routing change, monitoring period, and recovery objective.

### Stage D — controlled traffic switch

Promote the verified platform production deployment and change the canonical routing/domain only through the established hosting/DNS control. Perform an unauthenticated public smoke test, authenticated customer/crew/operations smoke tests, estimate-intake test, error/availability check, and canonical/redirect verification. Do not delete the old deployment or remove its domain configuration.

### Stage E — observation window

Monitor route availability, error rates, authorization denials, form conversion failures, background workflow failures, database/import reconciliation, search/index coverage, and customer support reports. During this window, preserve the exact old deployment alias, import logs, and target configuration snapshot.

## Rollback triggers

Immediate rollback is appropriate if an authorization boundary is bypassed, the platform exposes customer/operational data incorrectly, public intake fails materially, a critical public route is unavailable, incorrect public claims are published, data integrity is compromised, or the release cannot be reconciled. Non-critical visual/content defects should use a focused hotfix when the secure fallback is not needed.

## Rollback procedure

1. Stop the release and record the incident timestamp, deployed commit SHA, routing state, and observed evidence.
2. Restore traffic to the previously verified protected website deployment alias or routing configuration.
3. Disable platform-side workflows or external-effect routes if they could continue acting after traffic rollback.
4. Preserve logs, errors, database/import batch IDs, and authorization evidence; do not run destructive cleanup.
5. If a data-import batch is implicated, execute only the documented batch rollback after checking for authorized post-import edits.
6. Verify public homepage, estimate intake, and protected website administrator containment after routing restoration.
7. Open a recovery node with root cause, affected records/users, remediation branch, verification plan, and a new release decision requirement.

## Archive criteria for the website repository

The production website repository can be archived only after the platform has sustained the defined observation period, data reconciliation is complete, public routes and SEO redirects are stable, legal/privacy content is reviewed, the legacy admin surface is retired, no active operational dependency remains, backups/exports are retained under policy, and a final rollback decision concludes that the old deployment is no longer required.

## Non-negotiable business-action boundary

No automated release, workflow, agent, or migration script may submit bids, accept procurement terms, sign certifications, execute contracts, make pricing commitments, or send approval-required outreach. Those actions require separate named human/business approval even after platform cutover.
