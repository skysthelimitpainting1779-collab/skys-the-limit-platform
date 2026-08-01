# Changes — Milestone 3: Wire Convex Backend Endpoints to Next.js 16 App Shells

## Overview
Successfully wired Convex backend queries and mutations to the Next.js 16 app shell client components (`/estimate`, `/customer`, `/crew`, `/operations`), configured `ConvexClientProvider` fallback handling, enhanced UI with motion primitives (`motion/react`), and verified full build/test compliance.

## Detailed Modifications

### 1. Convex React Provider & Layout Setup
- **`src/components/providers/ConvexClientProvider.tsx`**: Created Client Component wrapping children in `ConvexProvider`. Implemented fallback handling (`FALLBACK_CONVEX_URL = "https://sandbox-placeholder.convex.cloud"`) when `NEXT_PUBLIC_CONVEX_URL` is unset or undefined, preventing build/render crashes in CI and offline test environments.
- **`src/lib/convex/provider.tsx`**: Re-exported `ConvexClientProvider` from `src/components/providers/ConvexClientProvider`.
- **`src/app/layout.tsx`**: Wrapped root body layout children with `<ConvexClientProvider>`.

### 2. App Shell Components & Endpoint Wiring
- **Estimate Form Shell (`/estimate`)**:
  - `src/components/estimate/EstimateForm.tsx`: Wired form submit handler to `api.leads.create` and `api.estimates.create`. Added form validation, loading state, error alert banner, and submission confirmation view with reset option. Enhanced with `MotionPressable`.
  - `src/app/estimate/EstimateForm.tsx`: Re-exported `EstimateForm`.
  - `src/app/estimate/page.tsx`: Server Component with metadata rendering `<EstimateForm />`.

- **Customer Portal Shell (`/customer`)**:
  - `src/components/customer/CustomerDashboard.tsx`: Wired to `api.estimates.listByLead` and `api.jobs.list`. Includes lead lookup search card, active estimates grid (showing line scope, formatted pricing total, status badges), scheduled jobs list, loading skeletons, and empty state cards. Enhanced with `MotionReveal`, `MotionStagger`, `MotionStaggerItem`, and `MotionPressable`.
  - `src/app/customer/page.tsx`: Server Component with metadata rendering `<CustomerDashboard />`.

- **Crew Workspace Shell (`/crew`)**:
  - `src/components/crew/CrewDashboard.tsx`: Wired to `api.jobs.list` and `api.jobs.updateStatus`. Features field execution schedule, job details cards, and interactive status change buttons (`start-job`, `mark-complete`, `reset`). Added loading pulse cards and error alerts. Enhanced with motion primitives.
  - `src/app/crew/page.tsx`: Server Component with metadata rendering `<CrewDashboard />`.

- **Operations Control Center Shell (`/operations`)**:
  - `src/components/operations/OperationsDashboard.tsx`: Wired to `api.leads.list`, `api.jobs.list`, and `api.auditEvents.listRecent`. Features lead status filter dropdown, inbound lead pipeline cards with status update selectors (`api.leads.updateStatus`), active field operations summary with status controls (`api.jobs.updateStatus`), and recent system audit trail event log with formatted timestamps.
  - `src/app/operations/page.tsx`: Server Component with metadata rendering `<OperationsDashboard />`.

### 3. Configuration & Type Definitions
- **`tsconfig.json` & `vitest.config.mts`**: Added `@convex/*` path aliases mapping to `./convex/*`.
- **`convex/_generated/api.d.ts`**: Updated `fullApi` type declarations to include `auditEvents`, `estimates`, `jobs`, `leads`, and `users` modules for TypeScript type resolution.

### 4. Test Suite Enhancements
- **`src/__tests__/app-shells.test.tsx`**: Added component test suite verifying `ConvexClientProvider` fallback instantiation without environment variables, component export validity, page route metadata compliance for all 4 routes, and JSX component node instantiation.

## Verification Summary
- `npm run verify:skills`: PASS
- `npm run verify:env`: PASS
- `npm run typecheck`: PASS (`tsc --noEmit` exited clean)
- `npm test`: PASS (54 tests passed across 8 test files)
- `npm run build`: PASS (Next.js 16 build generated 12 static routes cleanly)
- `npm run verify`: PASS (Complete pipeline verification succeeded)
