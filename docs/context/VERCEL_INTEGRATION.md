# Vercel Integration Guide — Sky's the Limit Platform

## Project Details

| Property | Value |
|----------|-------|
| Project Name | `sky-s-the-limit-platform` |
| Project ID | `prj_qeRoLVJmBAP5GilcbiyyQ2SAsEMY` |
| Team Scope | `skys-35411c00` (skys) |
| GitHub Repo | `skysthelimitpainting1779-collab/skys-the-limit-platform` |
| Production Branch | `main` |
| Preview Branch | `dev` and all feature branches |
| Node.js Version | `24.x` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Framework | Next.js (App Router) |

## Branch → Deployment Mapping

| Branch | Vercel Environment | URL Pattern |
|--------|--------------------|-------------|
| `main` | Production | `sky-s-the-limit-platform-skys-35411c00.vercel.app` |
| `dev` | Preview | `sky-s-the-limit-platform-git-dev-skys-35411c00.vercel.app` |
| `infra/*`, `feature/*`, etc. | Preview | `sky-s-the-limit-platform-git-<branch>-skys-35411c00.vercel.app` |

## Environment Variables Configured

### Non-Sensitive (all environments)
- `NEXT_PUBLIC_APP_URL` — Application base URL per environment
- `ENABLE_LIVE_EMAIL` — `false` (gates Resend email sending)
- `ENABLE_LIVE_STRIPE` — `false` (gates Stripe live mode)
- `ENABLE_PRODUCTION_CONVEX` — `false` (gates Production Convex access)

### Sensitive — Must Be Added Manually in Vercel Dashboard

These must be added by the project owner via the Vercel dashboard or CLI interactive mode:

| Variable | Environment | Notes |
|----------|-------------|-------|
| `NEXT_PUBLIC_CONVEX_URL` | preview | Preview Convex deployment URL |
| `NEXT_PUBLIC_CONVEX_URL` | production | Production Convex deployment URL |
| `NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID` | preview / production | Environment-specific active tenant for public lead intake |
| `LEAD_INTAKE_SECRET` | preview / production | Unique 32+ character proof key; set the same value in the matching Convex deployment |
| `CONVEX_DEPLOY_KEY` | production | From Convex dashboard → Project → Settings → Deploy Keys |
| `WORKOS_API_KEY` | production | Production WorkOS API key |
| `WORKOS_API_KEY` | preview | Isolated non-production WorkOS API key |
| `WORKOS_CLIENT_ID` | production | WorkOS Client ID |
| `WORKOS_CLIENT_ID` | preview | WorkOS Client ID |
| `WORKOS_COOKIE_PASSWORD` | preview / production | Unique 32+ character session-encryption secret per environment |
| `WORKOS_REDIRECT_URI` | preview / production | Server redirect URI ending in `/auth/callback` |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | production | `https://your-production-domain.com/auth/callback` |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | preview | `https://sky-s-the-limit-platform-skys-35411c00.vercel.app/auth/callback` |
| `WORKOS_ORGANIZATION_ID` | preview / production | Environment-specific invitation-only WorkOS organization |

`SKIP_ENV_VALIDATION=true` is allowed only for controlled local or CI
placeholder builds. It is explicitly rejected when `VERCEL_ENV` is `preview`
or `production`.

### Convex Function Environment

Convex actions and webhook handlers do not inherit Vercel environment
variables. Configure `WORKOS_WEBHOOK_SECRET`, `BLOB_READ_WRITE_TOKEN`, and the
matching `LEAD_INTAKE_SECRET` separately for each Convex deployment. WorkOS Actions are currently disabled;
configure `WORKOS_ACTION_SECRET` only if reviewed action handlers are enabled.
Preview Convex must never reuse Production WorkOS or Blob credentials.

## Adding Sensitive Variables

```bash
# Interactive (secure — value not exposed in shell history)
vercel env add WORKOS_API_KEY production --yes --scope skys-35411c00

# Or via Vercel Dashboard:
# https://vercel.com/skys-35411c00/sky-s-the-limit-platform/settings/environment-variables
```

## Production Domain

**Do NOT attach the production domain until explicitly approved.**

When ready:
```bash
vercel domains add your-production-domain.com --scope skys-35411c00
# Then configure DNS as instructed by Vercel
```

## Integrations Enabled

| Integration | Status | Notes |
|-------------|--------|-------|
| GitHub | ✅ Connected | Auto-deploys on push |
| Vercel Speed Insights | ✅ Enabled | Via project settings |
| Vercel Web Analytics | ✅ Enabled | Via project settings |
| Vercel OIDC | ✅ Enabled | For secure token exchange |
| Convex | 🔧 Needs cloud project | Run `npx convex login` + `npx convex dev` |

## Vercel Configuration File

`vercel.json` defines:
- Install command: `npm ci` (reproducible installs)
- Security headers: CSP, HSTS, X-Frame-Options, etc.
- Framework: Next.js
