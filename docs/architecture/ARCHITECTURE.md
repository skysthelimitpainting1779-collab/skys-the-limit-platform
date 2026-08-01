# Platform Architecture Blueprint

## System Overview

```text
Next.js App Router (UI & HTTP API Boundary)
        ↓
WorkOS AuthKit (Authentication & Organization Identity)
        ↓
Convex Reactive Database (Operational State & Authorization)
        ↓
Vercel Workflow Engine (Durable Multi-step Side Effects)
        ↓
Resend / Stripe / AI Gateway / Vercel Blob (Integrations)
```

## System Ownership Boundaries

- **Convex**: Operational business state (leads, customers, estimates, jobs, bids, documents, audit events).
- **Authentication (AuthKit)**: Identity validation, session tokens, organization membership proof.
- **Next.js App Router**: Client rendering, route handling, SEO optimization, asset distribution.
- **Vercel Workflow**: Long-running background workflows (lead qualification nurture, estimate follow-ups).
- **Resend**: Transactional email delivery (dormant until active credentials provided).
- **Stripe**: Payment processing & invoice settlement (sandboxed in Preview).
