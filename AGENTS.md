# AGENTS.md — Sky's the Limit Platform | Agent Governance Kernel

> Portable across: Codex, Claude Code, Cursor, Gemini/Antigravity, GitHub Copilot

---

## 0. MANDATORY PEER REVIEW — ZERO EXCEPTIONS

**Every agent that implements a work node MUST have a separate, independent evaluator agent review its output before the node may advance.**

The implementing agent is never the final authority on its own work.

### Peer Review Protocol

```text
IMPLEMENT (Agent A)
       ↓
SUBMIT EVIDENCE (code, tests, verification output, commit SHA)
       ↓
INDEPENDENTLY EVALUATE (Agent B — no instruction to preserve A's work)
       ↓
EVALUATOR VERDICT:
  pass           → advance to next node
  remediate      → Agent A fixes, re-evaluates
  human_review   → escalate to owner
  rollback       → revert, re-implement from contract
```

Evaluator must inspect:
- Contract compliance
- Architecture violations
- Security risks (secrets, exposed credentials, environment leakage)
- Missing or weakened tests
- False completion claims
- Unnecessary complexity
- Legacy contamination
- Unsafe production-effect boundaries

Record evaluator verdict to: `.agent/state/nodes/<node-id>.json` under `"evidence"`.

A node with `remediate`, `human_review`, or `rollback` verdict **may not advance**.

---

## 1. MANDATORY CONTEXT7 PROTOCOL

**Every subagent MUST use Context7 MCP for third-party library documentation. Training data is considered stale and unreliable.**

Steps:
1. `resolve-library-id` — resolve the exact library ID (never guess format `/org/project`).
2. `query-docs` — fetch authoritative, versioned API documentation.
3. Base all implementation decisions on fetched documentation, not memorized patterns.

**No exceptions.** If Context7 is unavailable, stop and report the blocker.

Context docs are cached in: `docs/context/*.md`

---

## 2. Architecture Authority

| System | Owner |
|--------|-------|
| Operational business state | Convex |
| Identity & session tokens | WorkOS AuthKit |
| App authorization & resource grants | Convex |
| UI rendering & HTTP API boundaries | Next.js App Router |
| Durable multi-step external effects | Vercel Workflow |
| Transactional email | Resend |
| Payment processing | Stripe |
| File storage (public/private) | Vercel Blob |
| AI model routing | Vercel AI Gateway |

Do NOT create a second database, parallel auth system, or generic Express backend.

---

## 3. Required Discovery Before Any Edit

1. Read `AGENTS.md` (this file).
2. Check `docs/context/` for research contracts.
3. Read `docs/architecture/ARCHITECTURE.md`.
4. Read relevant `docs/decisions/` ADRs.
5. Run `npm run verify:branch` from a clean checkout.
6. Check `git log --oneline -10` for recent commits.
7. Only THEN write or propose code.

---

## 4. Branch & Worktree Isolation

```
feature/* / fix/* / infra/* / docs/* / agent/*
         ↓ PR
        dev        (Preview only — never Production credentials)
         ↓ Release PR (requires owner approval)
        main       (Vercel Production)
```

- **Never develop directly on `main` or `dev`.**
- One branch per feature/node. Isolated worktrees for parallel work.
- Never force-push shared branches.
- Merging `dev → main` requires explicit owner approval.

---

## 5. Test-First Work Sequence

```
1. Write failing test / contract
2. Implement minimum change
3. Run focused verification
4. Run broader regression suite
5. Peer evaluator review (separate agent)
6. Record evidence + commit SHA
7. Commit with Conventional Commit message
8. Push + verify CI
```

Conventional Commit types: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `perf:`, `build:`, `ci:`, `chore:`, `revert:`

---

## 6. Production-Effect Boundaries

**STOP at `human_approval_required` before any of:**
- Attaching or moving the production domain
- Deploying to Production environment
- Enabling live Stripe charges
- Sending real customer email or SMS
- Mutating production Convex data
- Creating billable infrastructure
- Changing DNS
- Rotating credentials
- Deleting repositories, branches, or data
- Merging `dev → main`

---

## 7. Secrets & Credentials Policy

- **Never commit secrets, tokens, or credentials to the repository.**
- Server-only credentials must never appear in client bundles.
- Browser-exposed variables must use `NEXT_PUBLIC_` prefix and contain no sensitive data.
- Preview must never use Production credentials. Use separate isolated Preview environments.
- `.env.example` lists all required variable names with placeholder values only.

---

## 8. Drive Source Policy

All assets imported from Google Drive must:
1. Appear in `docs/sources/DRIVE_SOURCE_INDEX.md` with Drive file ID, classification, and approved uses.
2. Be classified before use: `public-approved`, `private-business`, `customer-confidential`, `migration-reference`, or `legacy-do-not-use`.
3. Only `public-approved` assets may be copied to `public/brand/` or `public/images/`.
4. Provenance recorded in `public/assets-manifest.json`.
5. Never commit customer data, insurance docs, pricing, or personal info to the public directory.

---

## 9. UI & Design Routing

- All design changes must reference `DESIGN.md` and `docs/design/FOUNDATIONS.md`.
- Motion: import from `"motion/react"` only. Never `framer-motion`.
- Respect `useReducedMotion()` in all animation components.
- No animation may block content availability, delay conversion, or hijack scroll.
- WCAG 2.2 AA contrast required on all interactive elements.
- Keyboard operability required on all interactive elements.

---

## 10. Stop Conditions

**Stop immediately and escalate to owner if:**
- A secret or credential is detected in the working tree.
- CI fails with a security-class error.
- A production domain is at risk of attachment.
- The peer evaluator returns `rollback` on a committed node.
- The working tree becomes dirty with unknown changes.
- Any required check (CI, Security, Vercel Preview) fails and cannot be remediated within retry limits.

---

## 11. Rollback Protocol

Every work node must document:
- The last known-good commit SHA
- The rollback command (`git revert <sha>` or `git reset`)
- Whether the rollback requires human approval (production effects)

Never delete rollback references.

---

*See thin host adapters: `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/00-agents-kernel.mdc`*
