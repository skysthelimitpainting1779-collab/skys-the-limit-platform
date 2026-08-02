---
name: project-discovery
description: Codebase discovery, structural analysis, and baseline state verification before making changes.
---

## Trigger
Use when initializing a work session or evaluating codebase requirements.

## Purpose
Ensure current system state, architecture, and baseline tests are understood before editing files.

## Required Inputs
- Task description
- Target repository path

## Allowed Files
- All codebase files in read-only mode

## Discovery Steps
1. Check repository structure and `package.json`.
2. Read `AGENTS.md` and relevant `docs/context/`.
3. Query `graphify` knowledge graph for node relationships.

## Current-Doc Requirement
Use Context7 to query official library docs when researching dependencies.

## Test-First Sequence
Run existing test suite to verify baseline health.

## Verification Commands
- `npm run verify:skills`
- `npm run typecheck`
- `npm test`

## Stop Conditions
Stop if build or baseline tests are failing before edit.

## Evidence Format
Summary of discovered files, dependency graph, and test results.

## Handoff Format
Architectural findings passed to implementation step.
