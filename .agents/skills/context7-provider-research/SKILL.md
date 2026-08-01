# Context7 Provider Research Skill

## trigger
Use when introducing or refactoring third-party library integrations.

## purpose
Fetch exact up-to-date API schemas and patterns using Context7 MCP.

## required inputs
Library name, integration concept.

## allowed files
`docs/context/*.md`

## discovery steps
1. Run `resolve-library-id` with exact package name.
2. Select high-reputation library ID.
3. Query docs for specific concept.

## current-doc requirement
Context7 resolution required. Do not rely on LLM training data.

## test-first sequence
Write contract test asserting expected library behavior.

## verification commands
`npm test`

## stop conditions
Stop if Context7 returns no matching authoritative documentation.

## evidence format
Saved record in `docs/context/`.

## handoff format
Context summary passed to feature implementation node.
