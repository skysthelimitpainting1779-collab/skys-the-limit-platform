# Convex Integration Guide — Sky's the Limit Platform

## Architecture

- **Convex** is the source of truth for all operational business data
- **Local development** uses `npx convex dev` (local instance on port 3210 by default)
- **Preview** environments use branch-specific Convex deployments provisioned by the Vercel Marketplace integration
- **Production** uses a dedicated Convex Production deployment

## Vercel-owned Preview project

Vercel owns the Preview control plane through the official Convex Marketplace
resource `skys-the-limit-platform-convex`. The resource is connected only to
Vercel Preview. Its managed `CONVEX_DEPLOY_KEY` creates or reuses one isolated
Convex deployment per Git branch.

The Vercel build runs:

```sh
if [ "$VERCEL_ENV" = "preview" ]; then
  npx convex deploy --cmd 'npm run build' --preview-run 'ci:ensurePreviewOrganization'
else
  npm run build
fi
```

`convex deploy` supplies `NEXT_PUBLIC_CONVEX_URL` to the Next.js build, pushes
the schema and functions, and then runs the internal Preview bootstrap. The
bootstrap reads the stable `WORKOS_ORGANIZATION_ID` and creates the matching
active organization inside that branch's database. Application requests never
carry a Convex document ID from another deployment.

## Preview defaults

Convex project-level Preview defaults are copied into every new branch Preview:

- `WORKOS_CLIENT_ID`
- `WORKOS_API_KEY`
- `WORKOS_ORGANIZATION_ID`
- `WORKOS_WEBHOOK_SECRET`
- `LEAD_INTAKE_SECRET`

Set or inspect names without printing secret values:

```bash
npx convex env default list --names-only --type preview --project skys:skys-the-limit-platform-convex
```

Production is intentionally not connected to the Marketplace resource and has
not been migrated by this Preview setup. The Vercel build condition preserves
the original Next-only Production build. Merging or promoting `dev` to `main`
still requires owner approval.

## Convex Schema Location

`convex/schema.ts` — Defines all tables:
- `users` — Platform users linked to WorkOS identities
- `organizations` — Business organizations
- `memberships` — User-org relationships with roles
- `leads` — Lead intake entries
- `estimates` — Job estimates
- `jobs` — Active jobs
- `auditEvents` — Immutable audit trail

## Running Functions Locally

```bash
npm run dev         # Start Next.js
npx convex dev      # Start Convex (separate terminal)
```

The local CI workflow writes the same fail-closed variables to its anonymous
Convex deployment and seeds by `WORKOS_ORGANIZATION_ID`.
