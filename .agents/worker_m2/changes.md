# Changes — Milestone 2 Backend Convex

## Overview
Implemented production-grade Convex backend mutations and queries for `leads`, `estimates`, `jobs`, `users`, and `auditEvents` in `convex/`, fully typed against `convex/schema.ts` and `convex/values` validators `v`. Added a comprehensive unit test suite in `src/__tests__/convex-functions.test.ts`.

## Detailed File Modifications

### 1. `convex/leads.ts`
- **`create`**: Mutation accepting `customerName`, `email`, `phone`, optional `address`, `projectType`, optional `status` (default `"new"`), and optional `notes`. Inserts into `leads` table with timestamp.
- **`get`**: Query returning a single lead by `leadId`.
- **`list`**: Query supporting optional `status` filter utilizing index `by_status`.
- **`updateStatus`**: Mutation updating lead status with validation ensuring existence.
- **`search`**: Query providing case-insensitive multi-field search (`customerName`, `email`, `phone`, `address`, `notes`).

### 2. `convex/estimates.ts`
- **`create`**: Mutation accepting `leadId`, `orgId`, `scope`, `pricing`, optional `status` (default `"draft"`). Verifies existence of lead and organization.
- **`get`**: Query returning estimate by `estimateId`.
- **`listByLead`**: Query filtering estimates by `leadId` using index `by_lead`.
- **`list`**: Query filtering estimates by `orgId` (using index `by_org`) and optional `status`.
- **`update`**: Mutation patching `scope`, `pricing`, or `status` with existence check.
- **`calculateTotal`**: Query and export helper `computeTotalFromPricing` supporting numeric pricing, object totals, itemized arrays, and custom pricing records.

### 3. `convex/jobs.ts`
- **`createFromEstimate`**: Mutation creating a job from an existing estimate, setting `orgId` from the estimate, setting status (default `"scheduled"`), schedule, and `crewIds`. Automatically marks the estimate status as `"accepted"`.
- **`get`**: Query returning job by `jobId`.
- **`list`**: Query filtering by `orgId` (index `by_org`) and `status` (index `by_status`).
- **`updateStatus`**: Mutation updating job status with existence check.
- **`assignCrew`**: Mutation assigning/updating array of `crewIds` (user IDs) with existence check.

### 4. `convex/users.ts`
- **`get`**: Query returning user by `userId`.
- **`getByClerkId`**: Query looking up user by `externalId` using index `by_externalId`.
- **`store`**: Mutation inserting a new user or updating an existing user matched by `externalId` (Clerk/WorkOS identity sync).
- **`updateRole`**: Mutation updating user role (`owner`, `staff`, `customer`, `crew`).
- **`list`**: Query listing all users with optional role filter.

### 5. `convex/auditEvents.ts`
- **`log`**: Mutation logging an immutable audit event (`actorId`, `action`, `targetResource`, `metadata`, `timestamp`).
- **`listByEntity`**: Query listing audit events by `targetResource` using index `by_target` sorted descending.
- **`listRecent`**: Query listing recent audit events sorted descending, supporting optional `actorId` filter (index `by_actor`) and limit (default 50).

### 6. `src/__tests__/convex-functions.test.ts`
- 19 new unit tests verifying functionality across all 5 Convex modules:
  - Database schema & validator adherence.
  - Default value resolution (`status: "new"`, `status: "draft"`, `status: "scheduled"`, timestamps).
  - Validation error throws (e.g. missing lead/estimate/job/user).
  - Index querying (`by_status`, `by_lead`, `by_org`, `by_externalId`, `by_target`, `by_actor`).
  - Search matching and pricing total calculation logic.
