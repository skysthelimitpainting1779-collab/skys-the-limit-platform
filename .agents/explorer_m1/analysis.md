# Codebase Discovery & Architectural Analysis Report

**Project**: Sky's the Limit Platform (`skys-the-limit-platform`)  
**Workspace Path**: `C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform`  
**Explorer Agent**: `explorer_m1`  
**Date**: 2026-08-01  

---

## 1. Executive Summary & Codebase State

The `skys-the-limit-platform` codebase is a modern Next.js 16 App Router application integrated with Convex backend services, Motion animations (`motion/react`), Tailwind CSS v4, Zod environment validation, and Vitest test suite. 

The repository is structured with high quality, adhering strictly to agent governance principles defined in `AGENTS.md` and design tokens in `DESIGN.md`. All 8 app routes and 6 core test suites pass verification cleanly (`npm run verify:branch` yields 23/23 passing tests).

However, the primary backend finding is that **no Convex query or mutation functions currently exist in `convex/`**. The database schema (`convex/schema.ts`) is fully defined with 7 core tables and indexes, but functions to interact with the database (lead intake, estimate creation, job scheduling, user management, and audit logging) are missing and must be implemented.

---

## 2. Project Architecture & Tech Stack

### Technology Matrix
- **Framework**: Next.js `16.2.12` (React `19.2.4`)
- **Backend Database**: Convex `1.42.3` (`convex/schema.ts`)
- **Styling & Design System**: Tailwind CSS `v4` (`@tailwindcss/postcss`), custom shadcn/ui components in `src/components/ui/` using Sky's Orange (`#E65100` / `hsl(21, 100%, 45%)`)
- **Animation System**: Motion `12.43.0` (`motion/react`), compliant with WCAG reduced motion preference (`useReducedMotion()`)
- **Type Safety & Environment Validation**: Zod `4.4.3` (`src/lib/environment/schema.ts`)
- **Testing Framework**: Vitest `4.1.10` (`npm test`, `npm run verify:branch`)
- **Node & NPM Requirements**: Node `>=24.0.0`, NPM `>=11.0.0`
- **Knowledge Graph**: Graphify enabled (`graphify-out/graph.json`, 197 nodes, 164 edges, 38 communities)

---

## 3. Convex Schema & Backend Deep Dive

### Database Schema (`convex/schema.ts`)
The Convex database schema defines 7 core business domain tables:

1. **`users`**
   - Fields: `externalId` (string), `email` (string), `role` ("owner" | "staff" | "customer" | "crew"), `name` (string), `phone` (optional string), `avatarUrl` (optional string).
   - Index: `by_externalId` (`["externalId"]`).

2. **`organizations`**
   - Fields: `name` (string), `slug` (string), `status` ("active" | "inactive" | "suspended"), `settings` (optional record).
   - Index: `by_slug` (`["slug"]`).

3. **`memberships`**
   - Fields: `userId` (id("users")), `orgId` (id("organizations")), `role` ("owner" | "admin" | "member"), `status` ("active" | "invited" | "disabled").
   - Indexes: `by_user_org` (`["userId", "orgId"]`), `by_org` (`["orgId"]`), `by_user` (`["userId"]`).

4. **`leads`**
   - Fields: `customerName` (string), `email` (string), `phone` (string), `address` (optional string), `projectType` ("residential" | "commercial" | "public-sector"), `status` ("new" | "contacted" | "qualified" | "scheduled" | "closed" | "lost"), `notes` (optional string), `createdAt` (number).
   - Index: `by_status` (`["status"]`).

5. **`estimates`**
   - Fields: `leadId` (id("leads")), `orgId` (id("organizations")), `scope` (string), `pricing` (union(number, record)), `status` ("draft" | "sent" | "accepted" | "declined" | "expired"), `createdAt` (number).
   - Indexes: `by_lead` (`["leadId"]`), `by_org` (`["orgId"]`).

6. **`jobs`**
   - Fields: `estimateId` (id("estimates")), `orgId` (id("organizations")), `status` ("scheduled" | "in_progress" | "completed" | "cancelled"), `schedule` (union(number, record, string)), `crewIds` (array(id("users"))), `createdAt` (number).
   - Indexes: `by_org` (`["orgId"]`), `by_status` (`["status"]`).

7. **`auditEvents`**
   - Fields: `actorId` (string), `action` (string), `targetResource` (string), `metadata` (optional record), `timestamp` (number).
   - Indexes: `by_target` (`["targetResource"]`), `by_actor` (`["actorId"]`).

### Missing Backend Query & Mutation Functions
`convex/` currently only contains `schema.ts` and `_generated/`. No handler files exist. To make the platform operational, the following Convex modules and functions need to be created:

- **`convex/leads.ts`**:
  - `createLead`: Mutation to save lead inquiries submitted via `/estimate`.
  - `listLeads`: Query to list incoming leads for `/operations`.
  - `updateLeadStatus`: Mutation for status transitions (`new` -> `contacted` -> `qualified` -> `scheduled`).
- **`convex/estimates.ts`**:
  - `createEstimate`: Mutation to create estimate from a lead.
  - `getEstimate`: Query by ID or leadId.
  - `listEstimatesByOrg`: Query for `/customer` portal and `/operations`.
- **`convex/jobs.ts`**:
  - `createJob`: Mutation to convert an accepted estimate into a scheduled job.
  - `listJobsByOrg`: Query for crew dispatch and operations schedule.
  - `updateJobStatus`: Mutation to update job status (`scheduled` -> `in_progress` -> `completed`).
- **`convex/users.ts`**:
  - `getCurrentUser`: Query for active user profile.
  - `upsertUser`: Mutation for auth login/signup user provisioning.
- **`convex/organizations.ts`**:
  - `getOrgBySlug`: Query organization metadata.
  - `createOrg`: Mutation to initialize default organization.
- **`convex/auditEvents.ts`**:
  - `logAuditEvent`: Internal/public mutation to record compliance audit trails.

---

## 4. App Routes & UI Components Inventory

### App Router Structure (`src/app/`)
All 8 app routes export functional React Server/Client Components and metadata:

1. **`/` (`src/app/page.tsx`)**: Main homepage showcasing company branding ("Sky's the Limit Painting LLC"), hero banner, CTA buttons, and interactive cards linking to all platform sections.
2. **`/estimate` (`src/app/estimate/page.tsx`, `EstimateForm.tsx`)**: Lead generation page with `EstimateForm.tsx` (fullName, email, phone, projectType, details inputs). *Note: `EstimateForm` currently uses `onSubmit={(e) => e.preventDefault()}` awaiting Convex mutation integration.*
3. **`/customer` (`src/app/customer/page.tsx`)**: Customer Portal dashboard featuring Active Estimates, Color Palette approvals, and Invoice/Billing views.
4. **`/crew` (`src/app/crew/page.tsx`)**: Field Crew Workspace with Daily Schedule dispatch, Prep Checklist verification, and Safety/OSHA 30 compliance logs.
5. **`/operations` (`src/app/operations/page.tsx`)**: Operations Control Center managing Estimating Pipeline, Resource Allocation (spray rigs, scaffolding), and Financial/Prevailing Wage Overviews.
6. **`/residential` (`src/app/residential/page.tsx`)**: Residential Division detailing Interior Painting, Exterior Weatherproofing, and Cabinet Refinishing services.
7. **`/commercial` (`src/app/commercial/page.tsx`)**: Commercial Division detailing Retail & Office buildouts, Multi-Family repaints, and Epoxy/Specialty Coatings.
8. **`/public-sector` (`src/app/public-sector/page.tsx`)**: Public Sector Division covering Prevailing Wage compliance, K-12/Higher Education, Municipal Infrastructure, and Anti-Graffiti coatings.

### UI & Motion Architecture
- **Shadcn UI Components (`src/components/ui/`)**: `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`. Built with `class-variance-authority` and styled with Sky's Orange (`#E65100`).
- **Motion Components (`src/design/motion/`)**: `MotionReveal`, `MotionStagger`, `MotionPressable`, with motion tokens (`tokens.ts`), variants (`variants.ts`), and reduced motion wrapper (`reduced-motion.ts`). All motion imports use `"motion/react"`.

---

## 5. Environment & Security Invariants

### Environment Validation (`src/lib/environment/schema.ts`)
- Environment schema enforces `NODE_ENV`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CONVEX_URL`, and WorkOS variables.
- Includes **Preview Isolation Guards**: Prevents production feature flags (`ENABLE_LIVE_EMAIL`, `ENABLE_LIVE_STRIPE`, `ENABLE_PRODUCTION_CONVEX`) from being enabled in non-production environments (`VERCEL_ENV !== "production"`).
- Obfuscated check (`String.fromCharCode(...)`) prevents secret regex false-positives in pre-commit hooks.

---

## 6. Annotations & Knowledge Graph Status

- **Codebase Scans**: Grep searches across all `.ts` and `.tsx` files revealed **0 explicit `TODO` or `FIXME` annotations**.
- **Graphify Knowledge Graph**: Located at `graphify-out/graph.json`. Includes 197 nodes, 164 edges, and 38 communities. Report (`GRAPH_REPORT.md`) and memory/reflections (`LESSONS.md`) are present and active.

---

## 7. Recommended Next Steps for Implementation (Milestone 2+)

1. **Implement Convex Function Modules**:
   - Create `convex/leads.ts` with `createLead` mutation.
   - Wire `EstimateForm.tsx` to call `useMutation(api.leads.createLead)` with toast/state feedback.
2. **Implement Workspace Dashboards Data Fetching**:
   - Create `convex/estimates.ts`, `convex/jobs.ts`, `convex/users.ts`.
   - Wire `/customer`, `/crew`, and `/operations` routes to real Convex query subscriptions (`useQuery`).
3. **Authentication & Membership Guards**:
   - Wire WorkOS AuthKit or Convex Auth middleware to protect `/crew` and `/operations` routes by role (`owner`, `staff`, `crew`).
