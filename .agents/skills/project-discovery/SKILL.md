# Project Discovery Skill

## trigger
Use when initializing a work session or evaluating codebase requirements.

## purpose
Ensure current system state is understood before editing files.

## required inputs
Task description, target repository path.

## allowed files
All codebase files in read-only mode.

## discovery steps
1. Check repository structure and package.json.
2. Read AGENTS.md and relevant docs/context/.

## current-doc requirement
Use Context7 to query official library docs.

## test-first sequence
Run existing test suite to verify baseline.

## verification commands
`npm run typecheck`, `npm test`

## stop conditions
Stop if build or baseline tests are failing before edit.

## evidence format
Summary of discovered files and test results.

## handoff format
Architectural findings passed to implementation step.
