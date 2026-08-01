---
name: peer-evaluator
description: >
  Spawn an independent peer evaluator agent to review a completed work node.
  Use this after implementing any feature, fix, or refactor — before committing or pushing.
  Triggered by: "evaluate this", "peer review", "run evaluator", "check my work", or at the end of any node implementation.
---

# Peer Evaluator Skill

## When to Use
After completing any work node — before the commit lands. This is the §0 mandate from AGENTS.md.

## How to Execute

Invoke a `self` subagent with this exact framing:

```
Role: "Peer Evaluator — Independent Review"

You are an independent evaluator. You did NOT implement this work.
Your job is to find problems, not preserve the implementor's choices.

Review the following node implementation:

COMMIT SHA: <sha>
CHANGED FILES: <list>
TEST OUTPUT: <paste>
CONTRACT: <paste the node contract from .agents/ or AGENTS.md>

Evaluate for:
1. Contract compliance — does the implementation match what was promised?
2. Architecture violations — does anything violate AGENTS.md §2 Architecture Authority?
3. Security risks — secrets, exposed credentials, environment leakage, PII in logs
4. Test integrity — were tests weakened, skipped, or mocked in ways that hide real failures?
5. False completion — does the code actually do what the commit message claims?
6. Unnecessary complexity — is there a simpler implementation?
7. Legacy contamination — does it re-introduce banned patterns (raw colors, banned claims, old field names)?

Return a structured verdict:
  pass | remediate | human_review | rollback

With specific line-level evidence for any non-pass verdict.
Record your verdict to .agent/state/nodes/<node-id>.json.
```

## Verdict Actions
- `pass` → advance to commit + push
- `remediate` → implementor fixes specific issues, re-evaluates
- `human_review` → escalate to owner with evidence
- `rollback` → revert to last known-good SHA, re-implement from contract
