# Reproducible test evidence

Documentation change: `bf88981640242d96bb03670d1289741849eab702`.
The verifier packet binds the final candidate after these evidence inputs are
committed.

Command:

```text
npx vitest run src/__tests__/lead-intake.test.ts src/__tests__/lead-intake-proof.test.ts src/__tests__/lead-intake-proof.property.test.ts src/__tests__/convex-lead-validation.test.ts convex/anonymousApiSecurity.test.ts
```

Result: PASS — 5 files, 22 tests, 0 failures.

Documentation link command:

```text
npm run docs:links
```

Result before candidate commit: PASS — 0 errors. The final exact-SHA gate must
rerun this command after the note is tracked.

The broader branch state immediately before the documentation-only candidate
also passed `npm run verify:branch` (26 agent-system tests and 197 application
tests), `npm run test:browser` (3 tests), and `npm run build` (Next.js 16.2.12).
