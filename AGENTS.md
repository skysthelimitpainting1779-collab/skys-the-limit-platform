# AGENTS.md — Sky's the Limit Platform

This file is the repository-wide operating contract for Codex, Claude Code, Cursor, Gemini/Antigravity, GitHub Copilot, and human contributors.

## 1. Mission

Build a trustworthy, conversion-focused operating platform for Sky's the Limit Painting LLC while preserving strict separation between public marketing, private business data, Preview resources, and Production effects.

The immediate product path is:

```text
public service page
→ structured estimate intake
→ validated, idempotent Convex lead
→ protected operations follow-up
```

Do not expand into unrelated platform breadth before the current vertical slice is verified.

## 2. Truth before completion

Repository state, provider state, and documentation must agree.

- Never mark a node complete because files were written.
- Never record `ci_status=success` until required checks pass for the exact head SHA.
- Never record `vercel_status=ready` until the canonical Vercel project has a READY Preview for the exact head SHA.
- Never describe a provider integration as active when only an interface or decision document exists.
- Preserve failed attempts and reconciliation evidence; do not rewrite history to make a run look successful.

## 3. Tool availability

The workflow must remain executable even when optional plugins are unavailable.

### Required behavior

- Use current first-party documentation before changing an external library or provider contract.
- Use Context7 when available; otherwise use the provider's official docs and record the fallback.
- Use connected GitHub, Vercel, Convex, and Google Drive tools when the task depends on their remote state.
- Use an isolated worktree or equivalent branch workspace for implementation.

### Optional accelerators

Graphify, gstack, Antigravity skills, Sequential Thinking, Vercel plugin skills, and local memory tools may be used when installed and relevant. Their absence must not block deterministic repository work.

If `graphify-out/graph.json` is current and Graphify is available, query it before broad source scanning. After code changes, update the graph when the tool is available. Never treat a stale graph as stronger evidence than source code or Git history.

## 4. Architecture authority

| Concern | Authority |
| --- | --- |
| Web UI and explicit HTTP boundaries | Next.js App Router |
| Operational business state | Convex |
| Identity and sessions | WorkOS AuthKit, once Staging is provisioned |
| Resource authorization | Convex functions and stored grants |
| Deployment and Preview execution | Vercel Git integration |
| Durable external workflows | Vercel Workflow, deferred until a real feature requires it |
| Transactional email | Resend, deferred |
| Payments | Stripe, deferred |
| Runtime file storage | Vercel Blob, deferred |
| AI model routing | Vercel AI Gateway, deferred |

Do not introduce a second database, parallel authentication system, generic Express backend, or competing workflow engine without an accepted architecture decision.

## 5. Bootstrap cost boundary

Upfront operation must remain within GitHub included usage, Convex free development resources, and the active Vercel Pro trial.

Do not activate or call the following without explicit owner approval and a shipped feature that requires them:

- Vercel AI Gateway
- Vercel Workflow runtime
- Vercel Queues
- Vercel Blob
- live Stripe
- Resend customer email
- customer SMS or phone automation
- Production WorkOS
- Production Convex
- billable marketplace integrations

## 6. Branch and release model

```text
feature/* | fix/* | infra/* | docs/* | agent/* | chore/*
                         ↓ pull request
                        dev
                         ↓ release pull request
                        main
```

- Never develop directly on `main` or `dev`.
- One branch per bounded change.
- Never force-push a shared branch.
- Feature and integration branches deploy only to Vercel Preview.
- `main` is the Vercel Production branch.
- Merging `dev` into `main`, deploying Production, or moving a domain requires explicit owner approval.

## 7. Discovery before editing

1. Confirm repository, remotes, branch, clean-worktree state, and exact head SHA.
2. Read this file and the relevant architecture, decision, context, design, and runbook documents.
3. Inspect the smallest relevant source and test surface.
4. Reproduce the current failure or baseline.
5. Define the acceptance contract and stop conditions.
6. For third-party work, confirm the installed version and current official API.

Do not scan the entire repository when a focused path, diff, graph query, or test identifies the relevant surface.

## 8. Test-first implementation

Behavior changes follow this sequence:

```text
write failing test
→ observe the expected failure
→ implement the smallest fix
→ pass the focused test
→ run regression verification
→ review the diff
→ commit
→ push
→ verify exact-head CI and Vercel
```

Do not weaken a test to accommodate an implementation. Configuration and documentation-only changes may use executable validators instead of unit-test RED/GREEN when no runtime behavior changes.

## 9. Review requirements

For authentication, authorization, secrets, payments, provider routing, customer data, idempotency, destructive actions, branch rules, or Production effects, use an independent reviewer when a separate agent is available.

When no subagent is available, perform a separate fresh review pass after implementation, state that limitation in the evidence, and require automated contract, regression, security, and remote checks. The implementer is never allowed to substitute an unsupported completion claim for missing review evidence.

## 10. Verification contract

The canonical local command is:

```bash
npm run verify
```

It must cover governance, skills, environment, asset provenance, content integrity, lint, TypeScript, tests, and production build.

Lead intake additionally requires the `Lead Intake E2E` GitHub Actions job, which boots an anonymous Convex backend, starts the production-built Next.js server, creates a lead, and proves duplicate idempotency.

Remote completion requires:

- exact-head `Validate`
- exact-head `Branch Policy`
- exact-head `Security Policy`
- exact-head `npm Audit`
- exact-head `Lead Intake E2E` when the lead path changes
- a READY Vercel Preview in project `prj_qeRoLVJmBAP5GilcbiyyQ2SAsEMY` for the exact head SHA

An older green SHA is not evidence for a newer commit.

## 11. Secrets and environment isolation

- Never commit tokens, passwords, private keys, cookies, or provider credentials.
- Real `.env` files are prohibited; `.env.example` contains names and inert placeholders only.
- Server credentials must not use `NEXT_PUBLIC_`.
- Preview must not use Production WorkOS, Convex, Stripe, Resend, or storage resources.
- External effects remain disabled unless both the Production tier and the explicit feature gate permit them.
- Do not log raw lead or customer PII.

## 12. Convex rules

- Public functions require argument and return validators.
- Validate again inside a public Convex mutation; do not trust the Next.js boundary alone.
- Server code owns authoritative timestamps, statuses, actor identity, and audit records.
- Use indexes for portal access, idempotency, and bounded abuse controls.
- Never scan an unbounded business table from a public function.
- Preview and test data must remain isolated from Production.

## 13. Drive and public asset policy

Every public asset must have:

- a real Google Drive file ID or other authoritative source;
- classification and content owner;
- approved and prohibited uses;
- review date;
- a real SHA-256 digest;
- a matching entry in `public/assets-manifest.json`.

Only `public-approved` assets may live under `public/brand` or `public/images`. Project photography, testimonials, municipal proof, certifications, insurance claims, warranties, and awards require approval in the Proof & Permission Ledger before publication.

## 14. Content and UI policy

- Follow `DESIGN.md` and `docs/design/CONTENT_STYLE.md`.
- Use semantic design tokens instead of raw palette classes or hex colors in components.
- Prefer Server Components; add client boundaries only for real interaction.
- Motion imports come from `motion/react` and must respect reduced motion.
- Motion may clarify hierarchy or state but may not block content, delay conversion, or hijack scrolling.
- Interactive elements require keyboard operation, visible focus, semantic HTML, and WCAG 2.2 AA contrast.
- Never display a fake portal, fabricated business metric, unsupported capability, or placeholder private record.

## 15. Production-effect gates

Stop at `human_approval_required` before:

- merging `dev` into `main`;
- deploying or promoting Production;
- attaching or moving a Production domain;
- enabling live payments, customer messaging, or AI usage;
- mutating Production Convex data;
- changing DNS or credentials;
- creating billable infrastructure;
- deleting a repository, branch, deployment, domain, or business record;
- weakening branch protection or required checks.

## 16. Commits, pull requests, and evidence

Use Conventional Commits. Keep commits bounded and reviewable.

Every substantive PR must state:

- goal and scope;
- architecture and environment impact;
- failing-test or validator evidence;
- exact verification commands;
- exact head SHA and GitHub check conclusions;
- immutable Vercel Preview identity;
- Drive provenance for new assets;
- external-effect declaration;
- rollback command;
- deferred work and genuine blockers.

Keep foundation and feature PRs in draft until their exact head is green. Do not merge without owner approval.

## 17. Stop conditions

Stop and report a blocker when:

- a secret is detected;
- repository or provider identity cannot be proven;
- the worktree contains unexplained changes;
- a security-class failure cannot be resolved within bounded attempts;
- a provider operation would create cost or Production impact without approval;
- the architecture would require a second source of truth;
- required exact-head evidence cannot be obtained.

## 18. Rollback

Record the last known-good SHA before each risky change. Prefer `git revert <sha>` for shared history. Do not delete rollback references. Production rollback always requires explicit owner coordination.

Thin host adapters may point here, but they must not duplicate or contradict this contract.
