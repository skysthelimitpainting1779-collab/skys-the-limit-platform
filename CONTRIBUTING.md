# Contributing

## Start correctly

1. Confirm the canonical repository is `skysthelimitpainting1779-collab/skys-the-limit-platform`.
2. Read `AGENTS.md` and the relevant architecture, decision, design, and runbook files.
3. Create an isolated branch from the correct base. Never edit `dev` or `main` directly.
4. Confirm the baseline before changing behavior.

Allowed branch prefixes:

```text
feature/  fix/  infra/  docs/  agent/  chore/  hotfix/
```

## Development sequence

For behavior changes:

```text
failing test
→ minimal implementation
→ focused test
→ npm run verify
→ diff review
→ commit
→ push
→ exact-head GitHub and Vercel verification
```

Do not weaken tests, commit secrets, fabricate provider state, or add speculative infrastructure.

## Commands

```bash
npm ci
npm run verify
npm run test:lead
npm run dev
```

The public lead path has an additional GitHub Actions gate named `Lead Intake E2E`.

## Commit format

Use Conventional Commits:

```text
feat: fix: docs: test: refactor: perf: build: ci: chore: revert: infra: agent:
```

Keep commits bounded. Do not combine a provider migration, a UI redesign, and unrelated cleanup in one commit.

## Pull requests

Open feature and infrastructure PRs against `dev`. Keep them draft until the exact head passes all required checks and has a READY Vercel Preview.

The PR must include:

- outcome and scope;
- test-first evidence;
- architecture, security, environment, and cost impact;
- exact verification results;
- Vercel Preview identity;
- Drive provenance for public assets;
- rollback command;
- deferred items;
- explicit external-effect statement.

Do not merge `dev` into `main` or promote Production without explicit owner approval.
