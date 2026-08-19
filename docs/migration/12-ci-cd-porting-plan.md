# CI/CD Porting Plan

## Principle

The website’s current delivery controls are stronger than the platform’s and provide useful invariants, not copy-paste workflow files. The platform must derive its own contract from its package scripts, Convex deployment model, WorkOS authentication requirements, and release paths. Existing controls are never weakened to make a migration easier.

## Current comparison

| Capability | Website | Platform | Target platform state |
|---|---|---|---|
| Clean install | `npm ci --ignore-scripts` | `npm ci` | `npm ci --ignore-scripts` after verified compatibility |
| External action references | Commit-SHA pinned and contract-checked | CI uses mutable major tags; security workflow has some pins | All external actions SHA-pinned and tested by contract |
| Lint/typecheck | Required separate CI commands | Required | Retain and include in one explicit verify command |
| Markdown lint | Required | Not present | Add for migration/architecture documentation |
| Tests | Required | Required | Retain plus RBAC, cross-org, cross-customer, and critical route suites |
| Build | Website build | Platform build with environment skip note | Build with a documented non-production environment contract; no broad silent skip |
| Dependency audit | Full high-severity audit | Production-only high audit | Full tree high-severity audit plus dependency review |
| CodeQL/dependency review | Present from historical audit baseline | Not verified in active workflow inventory | Add/verify hosted workflows and required checks |
| Workflow contract | `ci:contract` | No equivalent | Add workflow/script/action integrity contract |
| Deployment verification | Production-origin smoke target | Preview/release workflows present but not yet baseline-verified | Preview and production smoke checks against allowlisted origins |
| Branch ruleset | Active website ruleset | No remote ruleset | Protect `dev` and `main` with PR and required checks |

## Platform quality contract

The target `verify` chain runs the following stages in a deterministic order: skill/product-policy contract validation; environment contract validation; asset validation; immutable workflow and package-script contract; lint; typecheck; unit/contract tests; focused auth/RBAC tests; Convex code generation/validation; build; dependency audit; and diff hygiene. E2E, visual, accessibility, and deployment smoke checks run in their own explicit jobs because they need deployed environments.

All CI installs use the lockfile and avoid lifecycle scripts while validating untrusted pull requests, unless a documented build step requires a specific lifecycle script. Any exception must be narrowly scoped and include a security rationale. The build environment supplies only non-secret public test configuration and never production service credentials.

## Workflow hardening requirements

| Requirement | Implementation condition |
|---|---|
| Immutable action pins | Contract rejects `uses:` references without a 40-character commit SHA, allowing only locally checked-in actions as exceptions. |
| Least privilege | Each workflow/job declares only needed GitHub permissions. |
| Safe concurrency | Group derives from immutable GitHub ref or PR number, never event-provided deployment URLs. |
| Dependency review | Hosted pull-request review runs for changed lockfiles/dependencies. |
| Code scanning | CodeQL JavaScript/TypeScript runs on required branches and pull requests. |
| Dependency audit | `npm audit --audit-level=high` covers the full dependency tree after clean install. |
| Package script integrity | Contract verifies referenced scripts and key files exist; dead scripts are removed only after reference proof. |
| Convex validation | Code generation and deployment/config validation run against non-production configuration. |
| Auth/RBAC | Regression suite is a named required check; this cannot be hidden inside an optional test glob. |
| Deploy verification | Preview/production smoke targets are allowlisted origins; event payload cannot choose arbitrary destination. |
| Diagnostics | Failing jobs publish non-secret logs and test artifacts with short retention. |

## Branch and release policy

Feature work occurs in an isolated worktree and branch. The developer/agent commits small, single-purpose changes. A machine critic reviews changed paths against the execution-node contract. Pull-request CI runs before merge to `dev`; release verification and deployment smoke checks gate promotion to `main`. Direct pushes to `main` are prohibited. A human code-review requirement is not assumed, but legally or financially consequential business actions still require named business approval.

## Ruleset implementation sequence

Create or update remote rulesets only after CI checks are present and green in a pull request. The initial `main` and `dev` rulesets require pull requests, block force pushes and deletion, require the named quality/security/auth checks, and require resolved conversations only if that policy is intentionally retained. Do not enable a required check until it has run reliably under its exact name.

## Verification record

Each CI/CD slice appends to `docs/migration/VERIFICATION.md`: command, environment, commit SHA, exit code, duration, relevant output, hosted check URL, and deployment URL. A green local command is evidence but does not replace hosted checks or deployment smoke tests.

## References

[1]: https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions "GitHub Actions security hardening"
[2]: https://docs.npmjs.com/cli/v11/commands/npm-ci "npm ci"
