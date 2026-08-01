# Security Review Skill

## trigger
Use before PR creation or sensitive node completion.

## purpose
Ensure no secrets, unhandled permissions, or environment leaks exist.

## required inputs
Git diff, `.env.example`.

## allowed files
All codebase files.

## discovery steps
1. Scan diff for hardcoded tokens, API keys, or private URIs.
2. Check environment schema validation.

## current-doc requirement
Follow GitHub Security & OWASP guidelines.

## test-first sequence
Run security audit scripts.

## verification commands
`npm run verify:branch`

## stop conditions
Stop immediately if a committed secret is detected.

## evidence format
Security audit report summary.

## handoff format
Passed security clearance to release PR.
