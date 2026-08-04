# Original User Request

## 2026-08-01T17:57:09Z

<USER_REQUEST>
Build the complete production-grade Sky's the Limit Painting LLC platform foundation — a new private GitHub repository, Vercel project, governance framework, CI/CD pipeline, design system, Convex schema, and initial application shell — ready for feature development without touching the legacy website.

Working directory: ~/teamwork_projects/skys_the_limit_platform
Integrity mode: demo

---

## Context

The repository skysthelimitpainting1779-collab/skys-the-limit-platform has been initialized with a Next.js 16 App Router scaffold on main and a dev branch. An infra/initial-foundation working branch exists. The following has already been done:

- GitHub repo: https://github.com/skysthelimitpainting1779-collab/skys-the-limit-platform
- Local path: C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform
- Dependencies installed: next, react, convex, motion, lucide-react, vitest, tailwindcss
- Branches: main, dev, infra/initial-foundation
- Partial files already exist: AGENTS.md, DESIGN.md, docs/context/*.md, docs/architecture/, docs/decisions/, convex/schema.ts, scripts/validate-skills.mjs, .agents/skills/
- Vitest foundation test passing: npm test → 2/2 tests pass

The team must pick up where this left off and complete the foundation.

---

## Requirements

### R1. AGENTS.md — Mandatory Dual-Agent Peer Review Enforcement
Every agent that implements work must have a separate, independent evaluator agent review that work before it advances. The implementer is never the sole authority on its own output. This rule is already encoded in AGENTS.md and must be honored throughout the build.

### R2. Context7 Mandatory Documentation Research
Every agent must use Context7 MCP (resolve-library-id + query-docs) before implementing patterns for any third-party library. Agents must not rely on training-data memory for API contracts.

### R3. Complete Foundation Implementation
Complete all remaining foundation work on the infra/initial-foundation branch and open a draft PR to dev. The foundation is complete when:
- All application shell routes exist (/, /residential, /commercial, /public-sector, /estimate, /customer, /crew, /operations)
- shadcn/ui is initialized with core components installed
- Motion primitives are implemented in src/design/motion/ using motion/react (not framer-motion)
- Convex schema is finalized with users, organizations, memberships, leads, estimates, jobs, and audit events
- GitHub Actions CI/CD workflows exist (ci.yml, security.yml)
- .env.example and environment schema exist
- npm run verify passes cleanly: skills validation, typecheck, tests, build

### R4. Branch Protection & Vercel Project Linkage
Apply GitHub branch protection rulesets for main and dev. Create and link a Vercel project (skys-the-limit-platform) connected to skysthelimitpainting1779-collab/skys-the-limit-platform with main → Production and dev → Preview. The production domain must NOT be attached.

### R5. No Production Side Effects
Preview deployments must never use Production Convex databases, send real email, or trigger live Stripe events. All dormant adapters must be sandboxed. No secrets committed to the repository.

---

## Acceptance Criteria

### Peer Review Compliance
- [ ] Every implemented work node has an evaluator verdict recorded in .agent/state/nodes/<node-id>.json
- [ ] No node advances with remediate, human_review, or rollback verdict outstanding

### Code Quality & Verification
- [ ] npm run verify:skills passes — all .agents/skills/*/SKILL.md contain required sections
- [ ] npm run typecheck passes — zero TypeScript errors
- [ ] npm test passes — all Vitest tests green
- [ ] npm run build produces a clean Next.js production bundle with no errors

### Foundation Completeness
- [ ] All 8 route shells exist and render without runtime errors
- [ ] motion/react is used exclusively — no framer-motion imports anywhere
- [ ] src/design/motion/ contains: tokens.ts, variants.ts, reduced-motion.ts, Reveal.tsx, Stagger.tsx, Pressable.tsx, index.ts
- [ ] components.json (shadcn) exists and core components are installed
- [ ] convex/schema.ts defines all required tables with indexes
- [ ] .env.example contains all required variable names with no real values committed

### CI/CD & Repository Safety
- [ ] .github/workflows/ci.yml runs lint, typecheck, test, and build on PRs to dev and main
- [ ] .github/workflows/security.yml includes CodeQL and dependency audit
- [ ] GitHub branch ruleset desired state is documented in .github/rulesets/ even if API application requires owner approval
- [ ] Vercel project skys-the-limit-platform is linked to the correct repository
- [ ] No production domain attached to the Vercel project

### Production Safety
- [ ] src/lib/environment/schema.ts validates all required environment variables at startup
- [ ] Preview environments have no path to production Convex credentials
- [ ] No secrets, tokens, or credentials appear in any committed file

---

## Verification Resources



## 2026-08-01T19:22:31Z

<USER_REQUEST>
Target Workspace: C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform
Repository: skysthelimitpainting1779-collab/skys-the-limit-platform
Branch: infra/initial-foundation

Task: Execute autoloop discovery and development on Sky's the Limit Platform.
1. Run codebase discovery (`graphify`, TODO/FIXME annotations, Convex backend schema `convex/schema.ts`).
2. Implement backend database mutations & queries in `convex/` for leads, estimates, jobs, users, and audit logs.
3. Wire backend endpoints to Next.js 16 app shells: `/estimate`, `/customer`, `/crew`, and `/operations`.
4. Ensure all changes pass `npm run verify` (typecheck, tests, Turbopack build).
</USER_REQUEST>
## 2026-08-02T02:01:08Z

<USER_REQUEST>
# MISSION — SKY’S SIGNATURE OPERATING PLATFORM V4
# PUBLIC WEBSITE + CONVEX CMS + WORKOS AUTH + ROLE PORTALS
# SHADCN SOURCE-OWNED UI + LOCAL SOURCE PACK

Build the next major vertical stride for Sky’s the Limit Painting LLC.

The result must be one coherent operating platform containing:

1. A distinctive, proof-led, high-converting public website
2. A progressive Project Fit and estimate-request experience
3. WorkOS AuthKit authentication
4. A typed Convex CMS
5. A real operations portal
6. A secure customer portal
7. A mobile-first crew portal
8. Private project documents and controlled photo uploads
9. In-app notifications and activity history
10. Exact-head GitHub, Convex, and Vercel verification

This is not another infrastructure-only loop.
This is not another generic shadcn dashboard.
This is not another contractor-template redesign.

The public website, CMS, operations portal, customer portal, and crew portal must look and behave like one intentionally designed Sky’s the Limit platform.

---

# 1. CANONICAL RESOURCES

Repository: skysthelimitpainting1779-collab/skys-the-limit-platform
Base branch: dev
Resolve the exact live remote dev SHA before starting.
Create: feature/signature-operating-platform-v4
Open a draft pull request: feature/signature-operating-platform-v4 → dev
Vercel project: sky-s-the-limit-platform
Vercel project ID: prj_qeRoLVJmBAP5GilcbiyyQ2SAsEMY
Vercel team ID: team_6jq6BsnM4UErD1U1CTHTmIRq

Do not:
- create another repository;
- commit directly to dev or main;
- merge the pull request;
- deploy to Production;
- move the production domain;
- connect Preview to Production data;
- introduce another database;
- introduce another CMS;
- install another authentication provider;
- activate live Stripe;
- activate customer email or SMS;
- activate Vercel AI Gateway;
- activate Vercel Workflow;
- activate Vercel Queues;
- activate Vercel Blob;
- activate a paid marketplace service.

The current Vercel Pro trial may be used for included Preview functionality.

---

# 2. LOCAL SOURCE PACK

Input file: skys-signature-design-drive-pack.zip
Expected ZIP SHA-256: f73edca31da7202f2c992b39dfeba0ecf134e5d5f3044525b3de4e5d55e6da5d
Extract outside the repository: <repo-parent>/.source/skys-signature-design-drive-pack/
Verify sha256sum and every included file against SHA256SUMS.txt.
Read in order:
1. 00-guidance/00-START-HERE.md
2. 00-guidance/LOCAL-CODEX-HANDOFF.md
3. 03-reference/proof-permission-ledger.csv
4. 00-guidance/asset-usage-matrix.md
5. 00-guidance/drive-pack-manifest.json
6. 03-reference/marketing-operating-system-canonical.txt
7. 03-reference/capability-statement.txt
8. 03-reference/website-seo-deployment-audit-2026-07-27.txt
9. 00-guidance/missing-production-proof.md
10. 04-contact-sheet/drive-assets-contact-sheet.jpg

Create: docs/design/SOURCE_PACK_RECEIPT.md
Record ZIP hash, extraction path, manifest version, every file/asset/checksum, approval status, allowed/prohibited uses, missing production proof.

---

# 3. NON-NEGOTIABLE END GOAL

Public experience: luxury architecture studio + construction documentary + high-converting product experience + credible owner-led Twin Cities contractor.
Application experience: calm field-operations software + clear customer project tracking + fast mobile crew tools + same Sky’s visual identity.

---

# 4. REQUIRED SKILL ROUTING

Process: project-discovery, brainstorming/design specification, writing-plans, test-driven-development, systematic-debugging, verification-before-completion, requesting-code-review, security-review.
UI: shadcn, frontend-app-builder, react-best-practices, wireframe-to-interface, motion-system, responsive-ui-verification, accessibility-verification, visual-regression testing.
Backend: Convex, convex-feature-slice, authorization review, environment verification.
Delivery: Context7 provider research, Vercel Preview verification.

---

# 5. CONTEXT7 AND OFFICIAL DOCUMENTATION

Research third-party libraries (Next.js 16, React 19, shadcn/ui, Convex, WorkOS AuthKit, Motion, Zod, TanStack Table, Playwright, Vitest, Vercel Git Preview deployments) using Context7 MCP. Store records in `docs/context/`.

---

# 6. PLATFORM OWNERSHIP

Stack: Next.js App Router → WorkOS AuthKit → Convex authorization and business rules → Convex database/functions/scheduling/private file storage → Vercel native Git deployments.
Convex is single source of truth for all business data, CMS, claims, portal announcements, notifications, audit events.
WorkOS handles identity and sessions.

---

# 7. WORKOS AUTHKIT FOUNDATION

WorkOS AuthKit Staging. Identity model: Sky’s the Limit Painting LLC (internal users: owner, admin, estimator, PM, content editor, content approver, crew lead, crew member; external: customers).
Implement full authentication behavior and signed webhook sync with idempotency.

---

# 8. AUTHORIZATION MATRIX

Create `docs/architecture/AUTHORIZATION_MATRIX.md`. Define granular role rules for anonymous, customer, crew_member, crew_lead, estimator, project_manager, content_editor, content_approver, admin, owner.

---

# 9. SHADCN OPERATING CONTRACT

Inspect with `npx shadcn@latest info --json`. Source-owned primitives. Use semantic design tokens, clean form patterns, portal shells (Sidebar, Breadcrumb, Command, Sheet/Drawer), loading/empty/error states.

---

# 10. DESIGN SYSTEM

Two modes: Public mode (image-led, editorial, transformation-focused) and Application mode (calm, information-dense, responsive, task-oriented). Shared visual identity. Create design system docs under `docs/design/`.

---

# 11. CLAIMS AND PROOF GOVERNANCE

Convex `claims` table. CMS publication gate blocking content with unverified claims or candidate proof. Remove unverified marketing superlatives.

---

# 12. CONVEX CMS

Typed Convex CMS with `siteSettings`, `navigationItems`, `cmsPages`, `cmsPageSections` (discriminated section types), `cmsRevisions`, `services`, `proofAssets`, `projects`, `faqs`, `legalPages`. Revisioning, preview, and publication control.

---

# 13. CORE APPLICATION DATA & PRIVATE FILES

Operational entities (`users`, `organizations`, `memberships`, `roleGrants`, `leads`, `customers`, `properties`, `estimates`, `jobs`, `assignments`, `tasks`, `checklists`, `projectUpdates`, `documents`, `notifications`, `auditEvents`).
Convex private file storage with signed upload flows, MIME allowlist, size limits, authorization checks.

---

# 15–20. PORTALS, PROJECT FIT, AND PUBLIC WEBSITE

- Project Fit non-price intake (7 steps) replacing old price calculator.
- Operations Portal (`/operations`) for leads, CMS, claims, proof, settings.
- Customer Portal (`/customer`) for requests, estimates, progress, documents.
- Crew Portal (`/crew`) mobile-first for today's assignments, checklists, updates.
- In-App Notifications: Convex-native role-safe notification center.
- Public Website: Homepage (Proof in Every Layer), Services, Fit, Legal.

---

# 21–30. DESIGN LAB, QA, VERIFICATION, PR & EXECUTION GRAPH

Execute nodes V4-001 through V4-025.
Pass all test suites (`npm run verify`, `lint`, `typecheck`, `test`, `build`, `test:e2e`, `test:visual`).
Verify exact-head GitHub, Convex Preview, and Vercel Preview (READY, noindex).
Create draft PR (`feature/signature-operating-platform-v4 → dev`).
</USER_REQUEST>

## 2026-08-02T02:08:20Z

<USER_REQUEST>
User provided exact local source pack path: E:\Downloads\skys-signature-design-drive-pack.zip (or E:\Downloads\skys-signature-design-drive-pack.zip\skys-signature-design-drive-pack) for V4-002 extraction and verification.
</USER_REQUEST>
