# Vercel Git Preview Deployments — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/vercel/vercel`
- **Version:** Vercel Platform & Deployment Engine 2026
- **Official Source:** https://vercel.com/docs/deployments/preview-deployments
- **Decision Affected:** Branch preview deployments, environment variable isolation, security headers, and preview test automation.

## Key Contracts & Implementation Patterns

1. **Automatic Branch Deployment:**
   - Every push to a feature or `dev` branch generates a unique, immutable Vercel Preview URL (e.g. `https://skys-the-limit-git-<branch>-<team>.vercel.app`).

2. **Strict Environment Boundary:**
   - Preview deployments use dedicated Preview-tier environment variables.
   - Absolute prohibition against Preview environments accessing Production Convex databases, live Stripe credentials, or sending live customer emails.

3. **Search Engine Shielding:**
   - All Preview deployments output headers:
     - `X-Robots-Tag: noindex, nofollow`
   - Next.js root layout metadata enforces `robots: { index: false, follow: false, nocache: true }`.

4. **Integration & Smoke Testing:**
   - Playwright E2E and visual smoke test suites target Preview URLs in CI prior to PR merge.

5. **Deployment Promotion & Rollback:**
   - `main` branch pushes deploy to Production.
   - Instant 1-click or CLI rollback supported for any deployment SHA.
