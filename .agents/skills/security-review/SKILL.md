---
name: security-review
description: Audits code changes for secret leaks, hardcoded tokens, OWASP vulnerabilities, and environment schema compliance.
---

## Trigger
Use before PR creation, release verification, or completing sensitive feature nodes.

## Purpose
Ensure no secrets, unhandled permissions, or environment leaks exist in the codebase.

## Required Inputs
- Git diff
- `.env.example` schema

## Allowed Files
- All codebase files

## Discovery Steps
1. Scan diff for hardcoded tokens, API keys, or private URIs.
2. Verify environment schema validation (`scripts/validate-environment.mjs`).

## Current-Doc Requirement
Follow OWASP and GitHub security guidelines.

## Test-First Sequence
Run automated security audit scripts.

## Verification Commands
- `npm run verify:skills`
- `npm run verify:env`
- `npm run verify:assets`

## Stop Conditions
Stop immediately if a committed secret or untracked asset is detected.

## Evidence Format
Security audit report summary.

## Handoff Format
Passed security clearance to release PR.
