# Verification Ledger

## Recording protocol

Every implementation slice appends its repository, branch, commit SHA, environment, command, start/finish time or duration, exit code, relevant output, and evidence link. A green local command does not replace hosted pull-request checks, deployment checks, database replay, or route smoke verification where those are applicable.

## Baseline evidence

| Timestamp (PDT) | Repository / commit | Environment | Command or observation | Exit / result | Duration | Relevant output / evidence |
|---|---|---|---|---|---:|---|
| 2026-08-19 | Website `92a2bee8ecacc3a803767b5cd36ca25f3fd9a4dd` | Fresh clone | `git rev-parse --abbrev-ref HEAD && git rev-parse HEAD && git status --short` | PASS | <1s | `main`; clean tree; recorded in baseline. |
| 2026-08-19 | Platform `77c76ae1441f3e22a04b9f08306f98b1d502bf4b` | Fresh clone | `git rev-parse --abbrev-ref HEAD && git rev-parse HEAD && git status --short` | PASS | <1s | `main`; clean tree; recorded in baseline. |
| 2026-08-19 | Both repositories | Audit host | `node --version && npm --version` | BLOCKED for app verification | <1s | Node `v22.13.0`, npm `10.9.2`; repositories require Node 24 and platform requires npm 11. |
| 2026-08-19 | Website | Remote GitHub API | Repository rulesets listing | PASS | <1s | Active **Main governed lifecycle** ruleset found. |
| 2026-08-19 | Platform | Remote GitHub API | Repository rulesets listing | PASS | <1s | No remote ruleset found. |
| 2026-08-19 | Website | Unauthenticated browser | GET `https://www.skysthelimitpaintingllc.com/manage` | FINDING CONFIRMED | <5s | Operator Console and Init Owner control rendered; no credentials/actions submitted. Evidence: `/home/ubuntu/skys-audit/browser-security-observations.md`. |
| 2026-08-19 | Website | Source audit | Inspect `src/proxy.ts`, `src/app/manage/page.tsx`, Payload/Supabase config and migrations | FINDINGS CONFIRMED | <5m | Public `/manage`, browser sign-up, broad authenticated RLS policies, and production placeholder fallbacks verified. |
| 2026-08-19 | Platform | Source audit | Inspect `convex/**`, providers, package/workflow files | FINDINGS CONFIRMED | <5m | Missing active WorkOS/Convex bridge; unguarded role and record mutations/queries confirmed. |
| 2026-08-19 | Documentation worktree | Local filesystem | JSON parse for migration manifests | PENDING | — | Run after documentation writes are complete. |
| 2026-08-19 | Website / Platform | Declared runtime environment | Clean install, lint, typecheck, tests, build, audit | BLOCKED | — | Install Node 24/npm 11 first; do not treat current audit host as a compatible verification environment. |
| 2026-08-19 | Website | Supabase test environment | Migration replay and pgTAP RLS policy tests | BLOCKED | — | Requires local Supabase stack or authorized disposable project. |
| 2026-08-19 | Platform | WorkOS/Convex development environment | Auth bridge, codegen, protected function tests | BLOCKED | — | Requires non-production WorkOS and Convex configuration. |

## Required command ledger for future nodes

| Node | Required commands or observations |
|---|---|
| Website P0 containment | `npm ci --ignore-scripts`; `npm run ci:contract`; `npm run lint:ci`; `npm run lint:md`; focused failing/passing tests; `npm test`; `npm audit --audit-level=high`; `git diff --check`; hosted CI; unauthenticated deployed `/manage` verification. |
| Website RLS | `supabase db reset`; `supabase test db`; website regression suite; migration diff review; hosted CI; database change evidence. |
| Platform auth bridge | `npm ci --ignore-scripts`; `npm run lint`; `npm run typecheck`; RBAC tests; `npx convex codegen`; non-production deploy/dev validation; authenticated and anonymous preview smoke checks. |
| Platform RBAC kernel | Focused auth matrix suite; full `npm test`; `npm run build`; Convex codegen; cross-org/customer/crew test report; hosted CI. |
| Platform governance port | Workflow contract test; clean install; `npm run verify`; full audit; hosted dependency/security checks; branch ruleset evidence. |
| Public site route slice | Unit/route tests; visual desktop/tablet/mobile comparison; accessibility scan; metadata/sitemap/robots check; estimate intake E2E; preview smoke. |
| Cutover | Full required checks; data reconciliation; preview and production smoke; authorization smoke; rollback drill; deployment/routing evidence. |

## Current blockers

The declared Node 24/npm 11 runtime, a disposable Supabase policy-test environment, and non-production WorkOS/Convex configuration are external prerequisites. They are recorded in the execution graph rather than bypassed with placeholder configuration or weakened checks.
