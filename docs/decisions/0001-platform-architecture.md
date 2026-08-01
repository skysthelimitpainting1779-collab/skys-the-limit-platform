# Decision 0001: Target Platform Architecture

- **Status**: Accepted
- **Date**: 2026-07-31

## Context
Sky’s the Limit Painting LLC requires a modern, production-grade operating platform to manage residential, commercial, and public-sector projects, estimate requests, customer communications, and crew assignments.

## Decision
We select Next.js App Router + Convex + WorkOS AuthKit + Vercel Workflows as the unified platform stack.

## Consequences
- Single unified TypeScript codebase for UI, API, and database schemas.
- Convex reactive engine handles real-time state synchronization for crew and operations portals.
- Vercel Workflow handles crash-resilient external integrations without running custom background workers.
