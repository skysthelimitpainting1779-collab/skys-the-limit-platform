# Sky's the Limit Platform

Production-oriented Next.js and Convex foundation for Sky's the Limit Painting LLC.

## Current status

This repository is in bootstrap development. The active foundation PR targets `dev`; nothing in this branch has been promoted to `main` or attached to the existing production domain.

Working now:

- responsive public marketing and service-intake pages;
- structured estimate form with Zod validation and normalization;
- honeypot handling and payload limits;
- idempotent Convex lead creation;
- email- and phone-based bootstrap abuse controls;
- recoverable failure states and user receipt IDs;
- GitHub CI, security policy checks, production dependency audit, and a real anonymous-Convex E2E test;
- exact-head Vercel Preview deployment through native Git integration;
- approved Drive logo with checksum-backed provenance.

Deliberately not active yet:

- customer, crew, and operations authentication;
- cloud Convex Preview persistence on Vercel;
- live email, SMS, payments, file uploads, AI Gateway, Queues, or Vercel Workflow;
- Production deployment and domain cutover.

The protected portal routes display explicit setup states rather than fake dashboards.

## Stack

```text
Next.js 16 + React 19 + TypeScript
              ↓
      Route Handlers / RSC
              ↓
            Convex
              ↓
Vercel Git Preview deployments
```

WorkOS AuthKit is the accepted identity direction but remains deferred until a Staging environment is provisioned and authorization tests exist.

## Requirements

- Node.js 24
- npm 11
- Git

Version pins live in `.nvmrc`, `package.json`, and `package-lock.json`.

## Local setup

```bash
npm ci
cp .env.example .env.local
npx convex dev
npm run dev
```

Convex writes the local development URL into `.env.local`. Never commit that file.

Open `http://localhost:3000` and use `/estimate` for the lead-intake path.

## Verification

Run the complete deterministic local gate:

```bash
npm run verify
```

Focused commands:

```bash
npm run test:lead
npm run verify:assets
npm run verify:content
npm run verify:governance
```

GitHub Actions also runs `Lead Intake E2E`, which boots anonymous Convex, builds Next.js, submits a real lead twice, and requires the duplicate request to return the original receipt.

## Branch model

```text
feature/* | fix/* | infra/* | docs/* | agent/* | chore/*
                         ↓ PR
                        dev
                         ↓ release PR
                        main
```

Do not work directly on `dev` or `main`. `main` is the Vercel Production branch and requires explicit owner approval.

## Cost and production boundary

Bootstrap uses only included GitHub usage, free Convex development resources, and the active Vercel Pro trial. No paid integration or customer-facing external effect may be enabled without explicit approval.

See:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `DESIGN.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/design/CONTENT_STYLE.md`
- `docs/implementation/2026-08-01-lead-intake-loop.md`
- `docs/runbooks/VERCEL_BLOCKED_ROOT_CAUSE.md`
- `docs/runbooks/GITHUB_SECURITY_CAPABILITIES.md`

## Canonical resources

- Repository: `skysthelimitpainting1779-collab/skys-the-limit-platform`
- Vercel project: `sky-s-the-limit-platform`
- Vercel project ID: `prj_qeRoLVJmBAP5GilcbiyyQ2SAsEMY`

The similarly named `sky-s-the-limit-platform` repository is legacy reference material and must not be used for new development.
