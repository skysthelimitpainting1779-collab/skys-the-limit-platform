# Vercel Deployment & Workflows Context & Contract

- **Research Date**: 2026-07-31
- **Official Source**: Context7 Vercel Documentation
- **Selected Version / Contract**: Vercel Git Deployments & Vercel Workflow SDK
- **Decision Affected**: Preview vs Production deployment model, durable background workflows.
- **Important Constraints**:
  - `main` branch deploys to Production; `dev` and feature branches deploy to Preview.
  - Preview deployments must never access Production Convex databases or send real email/Stripe events.
  - Vercel Workflow handles multi-step durable background tasks (lead qualification, estimate follow-ups).
