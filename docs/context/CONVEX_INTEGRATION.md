# Convex Integration Guide — Sky's the Limit Platform

## Architecture

- **Convex** is the source of truth for all operational business data
- **Local development** uses `npx convex dev` (local instance on port 3210 by default)
- **Preview** environments use a dedicated Convex Preview deployment (separate from Production)
- **Production** uses a dedicated Convex Production deployment

## Setup: Cloud Convex Project

To link to a cloud Convex project (required for Preview/Production deployments):

```bash
# 1. Log in to Convex
npx convex login

# 2. Create and link a new Convex project
npx convex dev
# → Follow prompts to create "skys-the-limit-platform" project
# → This will write NEXT_PUBLIC_CONVEX_URL and CONVEX_DEPLOYMENT to .env.local
```

## Preview Isolation

**Critical**: Preview deployments must use Preview-tier Convex credentials, never Production.

When the Convex project is configured in cloud:
1. Go to https://dashboard.convex.dev
2. Find the project → Settings → Deployments
3. Copy the **Preview** deployment URL (format: `https://xx-slug-123.convex.cloud`)
4. Add to Vercel: `NEXT_PUBLIC_CONVEX_URL` → Preview environment only
5. Never cross-configure Preview with Production credentials

## Required Vercel Environment Variables

| Variable | Environment | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | preview | Preview Convex deployment URL |
| `NEXT_PUBLIC_CONVEX_URL` | production | Production Convex deployment URL |
| `NEXT_PUBLIC_CONVEX_URL` | development | Local: http://127.0.0.1:3210 (set in .env.local) |
| `CONVEX_DEPLOY_KEY` | production | Production deploy key (sensitive — set manually in Vercel dashboard) |

## Adding CONVEX_DEPLOY_KEY to Vercel

```bash
# Set as sensitive (encrypted, not readable after creation)
vercel env add CONVEX_DEPLOY_KEY production --yes --scope skys-35411c00
# Enter value when prompted (or use --value flag with the key)
```

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
