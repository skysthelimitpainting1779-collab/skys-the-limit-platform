# Sky's the Limit engineering constitution

Portable authority for every coding host. Host-neutral role semantics live in
`.agents/manifests/`; generated Codex and Antigravity adapters must not weaken
this file. Product architecture authority is
`.agents/decisions/CANONICAL_ARCHITECTURE.md`.

## Commands

```bash
npm run graph:query -- "<structural question>"
npm run host:compile
npm run host:check
npm run agents:parity
npm run agents:certify
npm run lint
npm run typecheck
npm test
npm run build
```

## 1. Engineering-work authority

- GitHub Issues are durable goals or problems. Sub-issues are independently
  executable work only when decomposition materially helps.
- A Draft PR is an active workstream; its head SHA is the only candidate truth.
- Prefer one coherent vertical slice and one primary writer. Reviews, CI,
  Preview, and ordinary QA are checks unless they require substantive new work.
- Only A0 is the root orchestrator. A0 decisions are `DISPATCH`, `WAIT`,
  `REMEDIATE`, `ESCALATE`, or `COMPLETE`.
- Do not create a parallel issue tracker, task database, CI system, orchestration
  service, or software-factory backend.

## 2. Graphify-first structural intelligence

- Before locating code, dependencies, owners, failures, blast radius, callers,
  callees, or affected tests, query Graphify.
- Use node inspection, neighbors, paths, communities, and reverse impact before
  reading source. Once Graphify surfaces an exact file or symbol, read it
  directly.
- Use the canonical repository's worktree-local graph for ordinary work. Never
  let parallel worktrees write one shared mutable graph.
- Broad `grep`, `rg`, recursive globbing, or filename discovery for code is
  denied unless Graphify is unavailable or exhausted and a task-scoped
  `.agents/evidence/graphify-exhaustion/<task>.json` record identifies the
  failed query, reason, permitted path, literal/pattern, and expiry.
- Save only useful, dead-end, or corrected investigation outcomes through
  Graphify's native work memory. Validated lessons additionally require proving
  tests, a clean verifier PASS, and an exact SHA.

## 3. Context7 current external truth

- Use Context7 when correctness depends on current external behavior: Next.js,
  React, Convex, WorkOS, Vercel, GitHub Actions, Motion, Playwright, UI
  primitives, Stripe, Resend, PostHog, or an unfamiliar/security-sensitive API.
- Record the resolved library ID, exact question, and implementation-affecting
  contract in the evidence packet.
- Skip Context7 for copy, internal naming, proprietary logic, or local refactors
  unaffected by vendor behavior.

## 4. Research and reuse before custom architecture

- Before a non-trivial new subsystem, integration, workflow, component,
  security/test/developer tool, agent capability, or MCP is custom-built, A0 or
  A2 invokes the read-only R0 Research & Reuse Scout.
- Search in order: existing project through Graphify; native current platform
  capability through Context7; official components/templates/registries;
  maintained open source; reference implementation; then custom code.
- Research is bounded to three rounds, five candidates, and three finalists.
  R0 recommends but never installs, writes, approves, or creates resources. A
  new dependency requires an isolated pilot, deterministic proof, security and
  license review, and an A0/A2 decision.
- Skip R0 for tiny fixes, copy, obvious local refactors, or an exact
  implementation already fixed by approved architecture. Research is a gate,
  not ceremony.

## 5. Git and worktree discipline

- One active writer maps to one bounded work item, branch, and isolated
  worktree. Do not implement directly on `main` or `dev`.
- Denied: `git add .`, `git add -A`, `git commit -a`, force-push,
  `git reset --hard`, `git clean -fd`, unscoped restore, `--no-verify`, and hook
  bypass. Stage explicit files and preserve repository hooks.
- Every verification packet names the base and candidate 40-character SHAs.
  Any edit invalidates evidence for the earlier SHA.

## 6. Entire provenance

- Preserve Entire CLI checkpointing and its Husky/host integrations. Entire is
  execution provenance and Git-linked recovery—not task, acceptance, project,
  or verification truth.
- Never remove or bypass Entire hooks without explicit human approval. Keep
  setup and maintenance procedure in a task-selected skill, not this kernel.

## 7. Scope, capabilities, and communication

- Role manifests are default-deny. A role writes only allowed paths and uses
  only declared skills, MCPs, tools, and GitHub capabilities.
- A0 may coordinate A1–A10, V0, and R0. A primary agent may report to A0, call its
  registered read-only specialist, and submit to its designated verifier.
- Standing workers do not direct one another. Specialists message only their
  declared sponsor or sponsors. Verifiers return structured results to A0 and never collaborate with
  implementers.
- Load progressively: this kernel, one domain capability, the matching skill,
  and at most one narrow specialist. Do not bulk-load skills, graph reports,
  histories, or unrelated evidence.

## 8. Independent exact-SHA verification

- Substantive candidates require the designated clean-context, read-only
  verifier. Verifier input is limited to the task contract, acceptance criteria,
  base/candidate SHAs, exact diff, Graphify evidence, relevant Context7 evidence,
  and reproducible test/Preview evidence.
- Parent conversation, parent reasoning, desired verdict, confidence statements,
  and provisional success claims are prohibited verifier inputs.
- Verdicts are `PASS`, `FAIL`, or `UNCERTAIN`. `FAIL` and `UNCERTAIN` block
  advancement. Verifiers never repair findings.

## 9. Bounded remediation and circuit breakers

- Defaults: three implementation cycles, three remediation cycles, two verifier
  cycles, and one specialist call.
- A retry must materially change the implementation, test, hypothesis,
  Graphify/Context7 evidence, dependency, or environment. Unchanged reruns are
  denied.
- Circuits are `CLOSED`, `OPEN`, or `HALF_OPEN`. Open on repeated/no-progress
  failure, exhausted budget, two verifier rejections, repeated MCP failure,
  scope/secret/production violation, critical security finding, held-out
  regression, metric tampering, false-PASS regression, or untrustworthy flake.
- An OPEN worker stops and preserves evidence. Only A0 may authorize one
  HALF_OPEN probe after materially new evidence.

## 10. Protected definition of good

- `.agents/evals/` defines versioned metrics, thresholds, public cases,
  protected held-out cases, fixtures, and verifier rubrics.
- A proposer may not change its own metrics, thresholds, weights, expected
  behavior, held-out cases, fixtures, or verifier rubric. Protected changes need
  separate human-governor authority and review.
- Prefer deterministic assertions. Judges are reserved for genuinely
  qualitative dimensions and must return a score plus reason.
- Accept an agent-system improvement only when its target improves, visible
  regressions do not materially regress, held-out behavior does not regress,
  protected artifacts are unchanged, and cost/latency remains inside budget.
  Public gain with held-out regression is `EVAL_OVERFIT`.

## 11. Production hard stops

- Agents never merge to `main`, promote/deploy Production, mutate Production
  Convex data, alter Production WorkOS, activate live Stripe, send real customer
  email/SMS, modify DNS/domains, rotate credentials, change visibility, bypass
  protection, or run destructive migrations.
- Preview and Production credentials and environments remain isolated. Sensitive
  authorization derives from authenticated server context, never caller-supplied
  organization, role, customer, or ownership.
- Human approval remains the release boundary.

## 12. Project architecture authority

- Canonical target: Next.js 16, React 19, TypeScript, Tailwind 4, Motion, Zod,
  Convex, WorkOS AuthKit, Vercel, GitHub Actions, Vitest/Node tests, and Playwright.
- The reusable product core plus customer configuration deploys to isolated
  Vercel projects, Convex deployments, credentials, and domains. Do not introduce
  runtime SaaS multi-tenancy without approval.
- Supabase, Payload, Directus, libSQL, Express, and duplicate persistence are
  legacy migration sources, not canonical platform dependencies.
- Preserve industrial UI conventions unless a redesign contract says otherwise:
  radius 0, `#FF5A00` on charcoal, no emoji in product source, reduced motion,
  keyboard support, and a WCAG 2.2 AA target.

## 13. Evidence and efficiency

- Always load the task contract, exact SHA, relevant Graphify result, and current
  circuit state. Load exact files, skills, external contracts, and specialist
  context only when needed.
- Measure tokens, tool calls, unnecessary context/dispatches, task latency,
  verifier latency, and eval runtime. Correctness outranks cost; noise without
  correctness value is waste.
- Test facts with code when code can prove them. Never certify capabilities from
  file presence or self-report alone.

## 14. Zero theater and stop conditions

- Every persistent agent artifact needs an executable consumer: compiler,
  validator, policy adapter, evaluator, query, or CI gate. Remove dead labels,
  mirrors, registries, status files, and governance prose.
- Stop and escalate instead of improvising when repository authority, official
  host behavior, MCP identity, worktree safety, secrets, verifier isolation,
  protected eval separation, exact SHA, or Graphify safety cannot be proven.
- Never declare completion because files parse, agents appear, a tool installs,
  or one smoke test passes. Completion requires cross-host behavioral evidence
  and the human production boundary intact.
