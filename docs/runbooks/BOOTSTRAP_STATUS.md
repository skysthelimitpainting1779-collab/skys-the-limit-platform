# Bootstrap status

## Verified capabilities

- Next.js 16 production build and Vercel Preview deployment.
- Public residential, commercial, public-sector, and estimate-intake routes.
- Zod validation, normalization, consent enforcement, honeypot handling, and payload limits.
- Direct Convex mutation validation, idempotency, and bounded email/phone abuse controls.
- Anonymous-Convex GitHub E2E proving lead creation and duplicate receipt behavior.
- Real Drive logo with checksum-backed public provenance.
- Free GitHub security policy and production dependency audit gates.

## Explicitly deferred

- WorkOS Staging and portal authentication.
- Isolated cloud Convex environment variables on Vercel Preview.
- Protected customer, crew, and operations data surfaces.
- Email, SMS, payments, file uploads, AI Gateway, Queues, and Vercel Workflow.
- Live GitHub Advanced Security controls that require paid private-repository features.
- Production promotion and domain cutover.

## Provider truth

The Vercel Preview builds successfully without a cloud Convex URL. In that state, `/api/estimate` returns a recoverable `503` rather than pretending a lead was saved. Complete persistence is separately proven in GitHub Actions against an anonymous Convex backend.

## Next provider-gated milestone

Provision an isolated cloud Convex development or Preview deployment, set `NEXT_PUBLIC_CONVEX_URL` only in the Vercel Preview environment, deploy the Convex functions and schema, then exercise the protected Preview form without enabling any Production effect.
