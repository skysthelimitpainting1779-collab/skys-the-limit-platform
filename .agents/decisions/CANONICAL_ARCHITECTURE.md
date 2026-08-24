# Canonical architecture decision

- Decision status: **ACCEPTED**
- Verification state: **PASS — clean-context V0 review**
- Decision date: 2026-08-14
- Decision commit: `6a9cbfbb93dbcc0cd6d008a737a092c87ba3cf65`
- V0 verdict: `PASS` for the exact decision commit above; no blocking issues

## Repository and branch authority

| Authority | Selection | Evidence |
|---|---|---|
| Canonical product and agent repository | `skysthelimitpainting1779-collab/skys-the-limit-platform` | The repository contains the accepted platform ADR, current Convex schema/functions, WorkOS trust-boundary tests, application portals, and the complete Preview/release workflow topology. |
| Integration branch | `dev` at base `bcbc26f5af75884c2828b2f104b030ad28113df3` | Current feature integration, Convex Preview, AuthKit, portal, CMS/CRM, and security work lives on `dev`. Feature work targets `dev` through Draft PRs. |
| Production branch | `main` at observed SHA `77c76ae1441f3e22a04b9f08306f98b1d502bf4b` | GitHub default branch and Vercel Production branch. No agent may merge, promote, or mutate Production. |
| Migration-source repository | `skysthelimitpainting1779-collab/skysthelimit-website` | Current public-site implementation and the earlier agent-team work live here, but its runtime still mixes Supabase, Payload, Directus, libSQL, and Express. |
| Active cross-host implementation | `feat/cross-host-agent-team` in the platform repository | Isolated worktree based on the exact `dev` SHA above. |

The canonical code architecture is therefore the platform repository. The website remains a migration source and current public deployment until a separate human-approved cutover; this decision does not move domains, deployments, credentials, or customer traffic.

## Target stack

The target is the platform `dev` contract, corroborated by `package.json`, `docs/decisions/0001-platform-architecture.md`, Graphify, and executable tests:

- Next.js 16.2.12, React 19.2.4, TypeScript 5, Tailwind CSS 4, Motion 12.43, Zod 4.4
- Convex 1.43 as the operational state and authorization boundary
- WorkOS AuthKit as authenticated identity and organization context
- Vercel as the Next.js Preview/Production delivery surface
- GitHub Issues, Draft PRs, checks, Projects, environments, and branch rules as durable engineering state
- Vitest/Node tests, Playwright where browser proof is required, Graphify, Context7, Entire CLI, and existing Husky hooks

No second runtime database, auth provider, task database, orchestration service, or agent framework may be introduced.

## Subsystem disposition

| Subsystem | Classification | Canonical boundary / migration action |
|---|---|---|
| Public marketing site | **MIGRATE** | Preserve verified content and assets from the website, but converge runtime ownership into platform routes and customer configuration. No traffic cutover in this goal. |
| Admin / operations | **CANONICAL** | Platform Next.js surfaces backed by Convex authorization. |
| CRM and lead intake | **CANONICAL** | Platform `convex/leads.ts`, customers, estimates, jobs, audit events, and lead-intake tests. |
| CMS | **CANONICAL** | Platform Convex CMS state. Payload and Directus remain legacy migration references only. |
| Customer and crew portals | **CANONICAL** | Platform App Router portals with WorkOS authentication and Convex authorization. |
| Authentication | **CANONICAL** | WorkOS AuthKit; caller-supplied identity, organization, role, customer, or ownership is never trusted. |
| Authorization and backend | **CANONICAL** | Convex server-side authorization, schema, indexes, actions, queries, mutations, migrations, and idempotency. |
| File storage | **CANONICAL** | Vercel Blob plus Convex metadata/policy. |
| Email and payments | **CANONICAL but DORMANT** | Resend and Stripe remain feature-gated; no live sends or charges. |
| Analytics and social integrations | **UNKNOWN / MIGRATE** | Inventory current website behavior before moving it; no invented replacement or new paid platform. |
| CI/CD | **CANONICAL** | Preserve the platform workflow suite and harden it; do not replace GitHub Actions or Vercel Git integration. |
| Agent and evaluation infrastructure | **MIGRATE / UPGRADE** | Consolidate useful PR #189 and local Codex-candidate behavior into host-neutral platform manifests and first-class host adapters. |

## Legacy boundaries

Supabase, Payload, Directus, libSQL, Express, website-local task state, and duplicate persistence are **LEGACY** for the target platform. They may be inspected as migration sources but may not be added to canonical platform paths. Removing them from the website runtime is a separate migration with its own product and deployment evidence.

## PR #189 disposition

[Website PR #189](https://github.com/skysthelimitpainting1779-collab/skysthelimit-website/pull/189) is **SUPERSEDED**, not amended:

- It targets the migration-source website repository rather than the canonical platform repository.
- Its head is `869f03dbcedd4a45cab293934ac1d8df26101fdb`, it is blocked on review, and route verification is cancelled.
- Independent review identified fail-open Graphify enforcement, weak read-only assertions, stale runtime-path certification, and other false-pass risks.
- The later local Codex work at `a722f062a118da9d26996b8e877d62b472b663bb` is a migration reference, not a merge target.

PR #189 must remain unmerged. Close it only after the canonical platform Draft PR exists and the owner approves the closure; link the successor before closing.

## Delivery and infrastructure observations

- Vercel project `sky-s-the-limit-platform` (`prj_qeRoLVJmBAP5GilcbiyyQ2SAsEMY`, team `skys-35411c00`) is connected to the platform repository.
- The Vercel project inspection reported a build command that differs from tracked `vercel.json`; this is configuration drift to diagnose without mutating Production.
- The platform repository currently reports no GitHub ruleset and its observed `main` and `dev` branches are not API-protected. Repository-setting changes require explicit human approval; CI must still fail closed locally and in PR checks.
- Platform Graphify was rebuilt in the isolated worktree: 9,054 nodes, 18,927 edges, 513 communities. The website graph remains separate. Cross-repository/global Graphify behavior is not yet certified.

## Migration boundary for this goal

This goal may change only the engineering agent team, its host adapters, tests, policies, evaluation harness, and existing CI gates needed to certify them. It may add a harmless documentation-only smoke change. It may not migrate application runtime data, attach domains, alter Production credentials, activate live integrations, or merge to `main`.

Detailed artifact classification: [AGENT_SYSTEM_MIGRATION.md](AGENT_SYSTEM_MIGRATION.md).

## Gate

Major agent specialization and host compilation were gated on a clean-context, read-only V0 review. V0 evaluated the exact decision commit above and returned `PASS`; specialization may proceed. Any material decision change requires a new exact-SHA review.
