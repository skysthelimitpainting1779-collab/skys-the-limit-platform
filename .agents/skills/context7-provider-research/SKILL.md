---
name: context7-provider-research
description: Fetch up-to-date API schemas, official documentation, and implementation patterns using Context7 MCP.
---

## Trigger
Use when introducing or refactoring third-party library integrations, SDKs, or external frameworks.

## Purpose
Fetch exact up-to-date API schemas and official documentation using the Context7 MCP server.

## Required Inputs
- Target library name (e.g., `react`, `next`, `convex`)
- Integration scope or concept

## Allowed Files
- `docs/context/*.md`
- `src/**`
- `convex/**`

## Discovery Steps
1. Run `resolve-library-id` with exact package name.
2. Select high-reputation library ID (`/org/project`).
3. Query official docs for specific concept using `query-docs`.

## Current-Doc Requirement
Context7 resolution required. Do not rely on outdated LLM training data.

## Test-First Sequence
Write contract test asserting expected library interface behavior.

## Verification Commands
- `npm run verify:skills`
- `npm test`

## Stop Conditions
Stop if Context7 returns no matching authoritative documentation.

## Evidence Format
Saved context documentation record in `docs/context/`.

## Handoff Format
Context summary passed to feature implementation task.
