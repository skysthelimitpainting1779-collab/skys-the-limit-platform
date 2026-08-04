# Project Plan: Sky's Signature Operating Platform V4

## Scope Overview
Orchestrate and execute the complete V4 platform build for Sky's the Limit Painting LLC, including Canonical Resources & Git Safety, Local Source Pack, Context7 & Architecture Docs, Convex CMS & Core Data, WorkOS AuthKit & Webhooks, Application Portals & Public Website, and Mandatory Governance & Quality Controls across nodes V4-001 through V4-025.

## Execution Nodes (V4-001 to V4-025)

| Node ID | Description | Primary Role / Strategy | Status |
|---|---|---|---|
| **V4-001** | **Git & Remote Hygiene**: Resolve `dev` remote SHA, create `feature/signature-operating-platform-v4`, open draft PR → `dev`, verify Vercel project linkage. | Worker + Reviewer | IN_PROGRESS |
| **V4-002** | **Source Pack Extraction & Receipt**: Extract `skys-signature-design-drive-pack.zip`, verify SHA256, create `docs/design/SOURCE_PACK_RECEIPT.md`. | Worker + Reviewer | IN_PROGRESS |
| **V4-003** | **Context7 & Architecture Docs**: Research dependencies via Context7, create `docs/architecture/AUTHORIZATION_MATRIX.md` & `docs/design/` foundations. | Worker + Reviewer | DONE |
| **V4-004** | **Claims & Proof Governance System**: Convex `claims` table, CMS publication gate blocking unverified claims/proof. | Worker + Reviewer | IN_PROGRESS |
| **V4-005** | **Convex CMS Schema & Infrastructure**: Typed CMS schema (`siteSettings`, `navigationItems`, `cmsPages`, `cmsPageSections`, `cmsRevisions`, `services`, `proofAssets`, `projects`, `faqs`, `legalPages`). | Worker + Reviewer | IN_PROGRESS |
| **V4-006** | **Core Operational Data & File Storage**: `users`, `organizations`, `memberships`, `roleGrants`, `leads`, `customers`, `properties`, `estimates`, `jobs`, `assignments`, `tasks`, `checklists`, `projectUpdates`, `documents`, `notifications`, `auditEvents` + private signed file storage. | Worker + Reviewer | IN_PROGRESS |
| **V4-007** | **WorkOS AuthKit Staging & Signed Webhooks**: AuthKit identity model, RBAC middleware, `/api/webhooks/workos` with signature validation & idempotency. | Worker + Reviewer | PLANNED |
| **V4-008** | **Navigation & Portal Shell Layouts**: Dynamic CMS-driven navigation, responsive shells for `/operations`, `/customer`, `/crew`, `/estimate`, `/public`. | Worker + Reviewer | PLANNED |
| **V4-009** | **In-App Notification Center & Audit Logger**: Convex-native role-safe notifications & realtime audit logging. | Worker + Reviewer | PLANNED |
| **V4-010** | **Project Fit 7-Step Non-Price Intake**: Progressive 7-step intake flow (`/estimate` & `/fit`) replacing old price calculator. | Worker + Reviewer | PLANNED |
| **V4-011** | **Public Website — Homepage**: "Proof in Every Layer" editorial homepage, transformation slider, client testimonials, capability statement, process section. | Worker + Reviewer | PLANNED |
| **V4-012** | **Public Website — Services, Fit & Legal**: `/services` catalog with category filters, `/fit` standalone intake, `/legal` pages driven by CMS. | Worker + Reviewer | PLANNED |
| **V4-013** | **Operations Portal — Dashboard & Leads**: `/operations/dashboard` metrics, `/operations/leads` management & status transitions. | Worker + Reviewer | PLANNED |
| **V4-014** | **Operations Portal — Estimate & Job Lifecycle**: `/operations/estimates` & `/operations/jobs` creation, proposals, scheduling, crew assignments. | Worker + Reviewer | PLANNED |
| **V4-015** | **Operations Portal — CMS & Claims Management**: `/operations/cms` section editor, revision history, preview toggle, `/operations/claims` proof ledger. | Worker + Reviewer | PLANNED |
| **V4-016** | **Customer Portal — Projects & Approvals**: `/customer/projects` overview, milestone tracking, proposal review & approval interface. | Worker + Reviewer | PLANNED |
| **V4-017** | **Customer Portal — Documents & Photo Uploads**: `/customer/documents` access to warranties/specs, controlled photo upload flow. | Worker + Reviewer | PLANNED |
| **V4-018** | **Crew Portal — Daily Assignment & Time Tracking**: `/crew/today` mobile-first job card, shift clock-in/out, customer/property notes. | Worker + Reviewer | PLANNED |
| **V4-019** | **Crew Portal — Checklists & Progress Updates**: `/crew` dynamic prep/paint/cleanup checklists & field photo progress upload. | Worker + Reviewer | PLANNED |
| **V4-020** | **Design Lab & Accessibility Verification**: `/design-lab` preview route, WCAG 2.2 AA check, Motion reduced-motion compliance. | Worker + Reviewer | PLANNED |
| **V4-021** | **Unit & Integration Test Suite Coverage**: Vitest tests for Convex functions, AuthKit middleware, Zod schemas, state machines. | Worker + Reviewer | PLANNED |
| **V4-022** | **End-to-End E2E & Visual Regression**: Playwright E2E tests for intake, auth, portals, visual regression snapshots. | Worker + Reviewer | PLANNED |
| **V4-023** | **CI/CD Pipeline & Security Compliance**: GitHub Actions `ci.yml`, `security.yml`, CodeQL, dependency audit, typecheck, build. | Worker + Reviewer | PLANNED |
| **V4-024** | **Vercel Preview Deployment & Environment Audit**: Vercel preview deployment verification (`READY`, noindex, env validation). | Worker + Reviewer | PLANNED |
| **V4-025** | **Final Peer Review & Forensic Audit Sign-off**: Independent peer review evaluation across all nodes in `.agent/state/nodes/` and clean Forensic Audit verdict. | Reviewer + Auditor | PLANNED |

## Dual-Agent Peer Review & Governance Protocol
1. Implementer (`teamwork_preview_worker`): Implements work node, runs unit/integration verification, submits evidence.
2. Independent Evaluator (`teamwork_preview_reviewer`): Evaluates code, tests, security, and contract compliance without bias. Records verdict (`pass`/`remediate`/`human_review`/`rollback`) in `.agent/state/nodes/<node-id>.json`.
3. Forensic Auditor (`teamwork_preview_auditor`): Validates code authenticity and zero-cheating compliance.
