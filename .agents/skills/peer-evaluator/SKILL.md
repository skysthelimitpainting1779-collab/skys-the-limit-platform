---
name: peer-evaluator
description: >
  Spawn an independent peer evaluator agent to review a completed work node.
  Use this after implementing any feature, fix, or refactor — before committing or pushing.
  Triggered by: "evaluate this", "peer review", "run evaluator", "check my work".
triggers:
  - peer review
  - evaluate this
  - run evaluator
  - check my work
---

# Skill: peer-evaluator

## Trigger
Triggered after completing a work node before commit.

## Purpose
Independent verification of code artifacts and test results to guarantee zero regression and strict adherence to governance constraints before pushing.

## Required Inputs
- Node ID
- Commit SHA
- List of changed files
- Output of test run

## Allowed Files
- `.agent/state/nodes/*.json`
- `src/**`
- `convex/**`

## Discovery Steps
1. Locate changed files.
2. Check for presence of tests.
3. Validate that no hex or raw Tailwind colors exist in modified frontend files.
4. Ensure no unapproved operational claims exist in modified pages.

## Current-Doc Requirement
Verify library usages against Context7 fetched cache files if present.

## Test-First Sequence
1. Check that unit tests cover all modified logic.
2. Run full test suite.

## Verification Commands
```bash
npm run typecheck
npm test
npm run lint
```

## Evidence Format
Verdict saved to `.agent/state/nodes/<node-id>.json`.

## Stop Conditions
- Evaluator returns `rollback` or `remediate`.
- Failed test suite.

## Handoff Format
Verdict report back to implementer.
