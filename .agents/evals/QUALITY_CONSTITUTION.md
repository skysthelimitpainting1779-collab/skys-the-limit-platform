# Quality Constitution

Version 1.0.0 · Human-governed definition of good for the Sky's engineering
agent team.

## Authority

This constitution, metrics, thresholds, held-out cases, protected fixtures, and
verifier rubrics sit upstream of the agents they evaluate. A proposer may
improve prompts, tools, skills, manifests, or policies; it may not alter the bar
used to judge that proposal. A protected change requires separate human-governor
authority and review.

## Global invariants

The following are release-blocking and have zero tolerance:

- unauthorized access successes
- invented business claims
- exact-head verification mismatches
- direct writes to `main` or `dev`
- Production effects by an agent
- secret exposure
- protected-evaluation mutation by a proposer
- false release PASS

## Evaluation order

1. Start with one failing behavioral case.
2. Establish the baseline at an exact SHA.
3. Classify the failure as prompt, skill, tool, context, permission,
   architecture, evaluator, dependency, or environment.
4. Make the smallest candidate change.
5. Re-run the target, visible regression suite, and protected held-out suite.
6. Reject regressions, flakiness, metric tampering, stale evidence, or budget
   excess. Public improvement with held-out regression is `EVAL_OVERFIT`.

Deterministic graders are mandatory wherever code can prove the fact. A model
judge is allowed only for genuinely qualitative dimensions and must emit both a
score and a reason. Security and release false PASS carries the highest penalty.

## Reliability and cost

Track pass@1 for direct reliability, pass@3 only inside the declared retry
budget, and pass^3 for release-critical stability. Also record latency, tool
calls, tokens when available, and flake variance. Lower cost is an improvement
only when quality still passes.

## Promotion

A candidate may be promoted only when the target improves, visible regression
does not materially regress, held-out behavior does not regress, no protected
artifact changed, deterministic global invariants pass, and cost/latency remains
inside the declared budget. Promotion never authorizes Production release.

## Separation limitation

Repository policy and CI make protected artifacts immutable to proposer roles.
The repository currently cannot hide their contents from every local checkout;
therefore final certification must not claim cryptographic held-out secrecy.
Moving protected cases to a private CI-only mount remains a human infrastructure
action, not something agents may improvise.
