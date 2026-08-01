# Original User Request

## 2026-08-01T17:57:09Z

<USER_REQUEST>
Build the complete production-grade Sky's the Limit Painting LLC platform foundation — a new private GitHub repository, Vercel project, governance framework, CI/CD pipeline, design system, Convex schema, and initial application shell — ready for feature development without touching the legacy website.

Working directory: ~/teamwork_projects/skys_the_limit_platform
Integrity mode: demo

---

## Context

The repository skysthelimitpainting1779-collab/skys-the-limit-platform has been initialized with a Next.js 16 App Router scaffold on main and a dev branch. An infra/initial-foundation working branch exists. The following has already been done:

- GitHub repo: https://github.com/skysthelimitpainting1779-collab/skys-the-limit-platform
- Local path: C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform
- Dependencies installed: next, react, convex, motion, lucide-react, vitest, tailwindcss
- Branches: main, dev, infra/initial-foundation
- Partial files already exist: AGENTS.md, DESIGN.md, docs/context/*.md, docs/architecture/, docs/decisions/, convex/schema.ts, scripts/validate-skills.mjs, .agents/skills/
- Vitest foundation test passing: npm test → 2/2 tests pass

The team must pick up where this left off and complete the foundation.

---

## Requirements

### R1. AGENTS.md — Mandatory Dual-Agent Peer Review Enforcement
Every agent that implements work must have a separate, independent evaluator agent review that work before it advances. The implementer is never the sole authority on its own output. This rule is already encoded in AGENTS.md and must be honored throughout the build.

### R2. Context7 Mandatory Documentation Research
Every agent must use Context7 MCP (resolve-library-id + query-docs) before implementing patterns for any third-party library. Agents must not rely on training-data memory for API contracts.

### R3. Complete Foundation Implementation
Complete all remaining foundation work on the infra/initial-foundation branch and open a draft PR to dev. The foundation is complete when:
- All application shell routes exist (/, /residential, /commercial, /public-sector, /estimate, /customer, /crew, /operations)
- shadcn/ui is initialized with core components installed
- Motion primitives are implemented in src/design/motion/ using motion/react (not framer-motion)
- Convex schema is finalized with users, organizations, memberships, leads, estimates, jobs, and audit events
- GitHub Actions CI/CD workflows exist (ci.yml, security.yml)
- .env.example and environment schema exist
- npm run verify passes cleanly: skills validation, typecheck, tests, build

### R4. Branch Protection & Vercel Project Linkage
Apply GitHub branch protection rulesets for main and dev. Create and link a Vercel project (skys-the-limit-platform) connected to skysthelimitpainting1779-collab/skys-the-limit-platform with main → Production and dev → Preview. The production domain must NOT be attached.

### R5. No Production Side Effects
Preview deployments must never use Production Convex databases, send real email, or trigger live Stripe events. All dormant adapters must be sandboxed. No secrets committed to the repository.

---

## Acceptance Criteria

### Peer Review Compliance
- [ ] Every implemented work node has an evaluator verdict recorded in .agent/state/nodes/<node-id>.json
- [ ] No node advances with remediate, human_review, or rollback verdict outstanding

### Code Quality & Verification
- [ ] npm run verify:skills passes — all .agents/skills/*/SKILL.md contain required sections
- [ ] npm run typecheck passes — zero TypeScript errors
- [ ] npm test passes — all Vitest tests green
- [ ] npm run build produces a clean Next.js production bundle with no errors

### Foundation Completeness
- [ ] All 8 route shells exist and render without runtime errors
- [ ] motion/react is used exclusively — no framer-motion imports anywhere
- [ ] src/design/motion/ contains: tokens.ts, variants.ts, reduced-motion.ts, Reveal.tsx, Stagger.tsx, Pressable.tsx, index.ts
- [ ] components.json (shadcn) exists and core components are installed
- [ ] convex/schema.ts defines all required tables with indexes
- [ ] .env.example contains all required variable names with no real values committed

### CI/CD & Repository Safety
- [ ] .github/workflows/ci.yml runs lint, typecheck, test, and build on PRs to dev and main
- [ ] .github/workflows/security.yml includes CodeQL and dependency audit
- [ ] GitHub branch ruleset desired state is documented in .github/rulesets/ even if API application requires owner approval
- [ ] Vercel project skys-the-limit-platform is linked to the correct repository
- [ ] No production domain attached to the Vercel project

### Production Safety
- [ ] src/lib/environment/schema.ts validates all required environment variables at startup
- [ ] Preview environments have no path to production Convex credentials
- [ ] No secrets, tokens, or credentials appear in any committed file

---

## Verification Resources



## 2026-08-01T19:22:31Z

<USER_REQUEST>
Target Workspace: C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform
Repository: skysthelimitpainting1779-collab/skys-the-limit-platform
Branch: infra/initial-foundation

Task: Execute autoloop discovery and development on Sky's the Limit Platform.
1. Run codebase discovery (`graphify`, TODO/FIXME annotations, Convex backend schema `convex/schema.ts`).
2. Implement backend database mutations & queries in `convex/` for leads, estimates, jobs, users, and audit logs.
3. Wire backend endpoints to Next.js 16 app shells: `/estimate`, `/customer`, `/crew`, and `/operations`.
4. Ensure all changes pass `npm run verify` (typecheck, tests, Turbopack build).
</USER_REQUEST>
