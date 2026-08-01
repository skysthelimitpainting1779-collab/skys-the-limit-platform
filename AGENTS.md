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

## 1.5. MANDATORY GRAPHIFY KNOWLEDGE GRAPH PROTOCOL — STRICT TOKEN REDUCTION

**Every subagent MUST query Graphify knowledge graph (`graphify-out/graph.json`) before reading or scanning raw files.**

To drastically reduce token usage and avoid blind file scanning:
1. **Query Graph First**: Always use `query_graph`, `get_node`, or `shortest_path` (via MCP or CLI `graphify query`) to traverse component relationships before making changes.
2. **GREP & GLOB ARE STRICT LAST RESORTS**: Do NOT use broad `grep`, `grep_search`, `glob`, or directory scanning unless Graphify tools completely fail to return context or when searching raw unindexed text configs.
3. **Graph Maintenance**: Automatic updates are handled via Git hooks (`.husky/post-commit`, `.husky/post-checkout`). Ensure `graphify-out/graph.json` is kept current.

---

## 1.6. MANDATORY ANTIGRAVITY SKILL MANDATE

**Every agent MUST leverage the `antigravity-guide` skill whenever operating, configuring, or resolving issues within Google Antigravity (AGY).**

1. Read `antigravity_guide/SKILL.md` before executing or altering Antigravity CLI commands, slash commands, customizations, or sidecars.
2. Do not attempt unguided configuration changes without checking official Antigravity patterns.

---

## 1.7. MANDATORY SEQUENTIAL THINKING PROTOCOL

**For complex architectural decisions, multi-file refactors, or debugging ambiguous errors, agents MUST use Sequential Thinking (`sequentialthinking`).**

1. Deconstruct complex problems into step-by-step hypothesis testing.
2. Validate assumptions explicitly before mutating codebase state.
3. Revise intermediate reasoning when new evidence or error tracebacks emerge.

---

## 1.8. MANDATORY CONTINUOUS LEARNING & ERROR MEMORY SYSTEM

**Agents MUST record corrected tool errors, tool misuse, and dead ends to `graphify-out/memory/` and check `graphify-out/reflections/LESSONS.md` to avoid repeating mistakes.**

1. **Check Lessons First**: Read `graphify-out/reflections/LESSONS.md` during discovery to learn from past session errors.
2. **Record Mistakes**: When a tool call or implementation strategy fails (e.g. invalid artifact path in `write_to_file`, trigger strings in pre-commit hooks, syntax mismatches), record it using `graphify save-result --outcome corrected`.
3. **Compile Reflections**: Run `graphify reflect` to update `graphify-out/reflections/LESSONS.md`.
4. **Local Tracking**: Learning memory is stored in `graphify-out/memory/` (unpushed local workspace memory) so it persists locally without polluting git commits.

---

## 1.9. TOOL USAGE & PRE-COMMIT INVARIANTS

1. **Artifact Path Scoping**: Only pass `ArtifactMetadata` to `write_to_file` when creating user-facing artifact files in `<appDataDir>\brain\<conversation-id>\`. For project workspace files (e.g. `.agents/`, `src/`), use `write_to_file` without `ArtifactMetadata`.
2. **Secret Regex Avoidance in Source Code**: Never hardcode literal secret pattern strings (e.g. `"sk_live_"`, `"pk_live_"`, `"ghp_"`) in source code or schema files. Use dynamic concatenation, character codes, or environment variables to avoid false-positive Husky pre-commit secret regex triggers.
3. **Track `.env.example` Contract**: Ensure `.gitignore` explicitly includes `!.env.example` so environment contracts remain tracked in Git while real `.env` files remain ignored.

---

## 1.10. AUTOMATED DISCOVERY & EXECUTION ENGINE (`/autoloop`)

**When `/autoloop` or "discover and fix" is invoked, agents MUST run the multi-source task discovery workflow and automatically pipe items through the closed-loop execution engine.**

1. **Multi-Source Discovery**:
   - Query Graphify knowledge graph (`graphify god-nodes` & `LESSONS.md`) for structural friction & unhandled errors.
   - Scan codebase for `TODO:`, `FIXME:`, `HACK:`, and `OPTIMIZE:` annotations.
   - Query open GitHub issues (`gh issue list`) and security alerts (`gh api repos/:owner/:repo/dependabot/alerts`).
   - Check pending spec requirements in `docs/decisions/` and `.agents/ORIGINAL_REQUEST.md`.
2. **Compile Work Graph**: Aggregate all discovered items into `.agent/graph/foundation.graph.json` with bounded node contracts.
3. **Automated Closed-Loop Execution**: Execute each node through the exact 13-step lifecycle:
   `DISCOVER → CONTRACT → FAIL_TEST → IMPLEMENT → VERIFY → REGRESSION_TEST → DUAL_AGENT_EVALUATE → RECORD_EVIDENCE → COMMIT → PUSH → VERIFY_CI → VERIFY_VERCEL → ADVANCE`.

---

## 1.11. MANDATORY MAKE-NO-MISTAKES (M-STACK) PROTOCOL

**Every subagent MUST activate `make-no-mistakes-max` for enterprise stakeholder alignment, zero-mistake technical execution, and risk de-risking.**

1. **Alignment Loop**: Before substantive execution, state the single-sentence North Star, scope hygiene, dependencies, and green metrics.
2. **Zero-Mistake Invariant**: Verify all system assumptions empirically before mutating files. No cargo-culting or silent unverified changes.
3. **Repeatable Narrative**: Provide outcome-first summaries with clear "what happens next" milestones.

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

## 3. Required Discovery Before Any Edit — Token-Efficient Flow

1. Read `AGENTS.md` (this file).
2. **Query Graphify First**: Run `query_graph` or `graphify query` to map relevant components. Do NOT read raw files broadly.
3. Check `docs/context/` for relevant research contracts if third-party libraries are involved.
4. Run `npm run verify:branch` from a clean checkout if running tests.
5. Only read specific target files surfaced by Graphify.
6. Write surgical, minimal code edits.

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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
