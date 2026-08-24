---
name: research-reuse-scout
description: Run a bounded read-only research and reuse gate before a non-trivial subsystem, integration, workflow, component, security mechanism, test harness, developer tool, or agent capability is custom-built.
---

# Research & Reuse Scout

## Trigger

Use when A0 or A2 is considering a new subsystem, infrastructure primitive,
backend capability, auth mechanism, workflow, queue, scheduler, storage layer,
CMS/CRM capability, UI primitive, test/security/CI tool, agent capability, MCP,
or repeated utility. Skip tiny fixes, copy, obvious local refactors, and work
whose approved architecture already dictates the exact implementation.

## Purpose

Prevent unnecessary custom architecture while rejecting dependencies that are
unsafe, bloated, stale, incompatible, or harder to own than small custom code.

## Required Inputs

- Current task contract and exact candidate SHA
- Required capability and hard constraints
- Canonical architecture decision and current circuit state

## Allowed Files

All repository files in read-only mode. Research packets are returned to A0 or
A2 for authorized persistence under `.agents/evidence/reuse/`.

## Boundary

R0 is read-only. Do not install packages, edit source or manifests, approve the
recommendation, create resources, or touch Production. Return evidence to A0
and A2. Research does not authorize adoption.

## Decision preference

`REUSE_EXISTING -> USE_NATIVE -> ADOPT -> ADAPT -> BUILD_CUSTOM`

`DEFER` and `REJECT` are valid. Open source existing is never sufficient reason
to adopt it; select the smallest trustworthy solution.

## Discovery Steps

1. Existing project: use Graphify query, path, community, affected analysis,
   existing skills/plugins/utilities/tests, Git history, PRs, and decisions.
2. Native platform: use Context7 for current official capability, components,
   integrations, templates, examples, SDK, CLI, MCP, and maintained packages.
3. Official ecosystem: check vendor directories and registries before generic
   GitHub/package search.
4. Open source: search by problem, not fashionable tool name. Use maintainer
   organizations, registries, standards bodies, security ecosystems, and only
   use Awesome lists as indexes.
5. Compare no more than five candidates and three finalists with
   `.agents/reuse/candidate-rubric.json`.
6. Emit a packet conforming to `.agents/reuse/packet.schema.json`; validate with
   `node scripts/reuse/validate-packet.mjs <packet>`.

Maximum three rounds. A later round must add a materially different candidate,
better evidence, or resolve a key uncertainty. Stop after two rounds without a
better candidate, when a native choice dominates, when small custom code is
obviously safer, when all candidates violate a hard requirement, or when a
business decision is missing. Mark the packet `RESEARCH_EXHAUSTED` when needed.

## Current-Doc Requirement

Use Context7 for native/vendor APIs and official capability claims. Record the
exact library ID, question, affecting contract, and source. Refresh unstable
maintenance, security, version, API, and licensing assumptions.

## Test-First Sequence

Define the missing behavior or measurable baseline before recommending a new
dependency. Adoption requires the smallest isolated pilot and a seeded,
deterministic proof before implementation.

## Adoption handoff

`research -> shortlist -> isolated pilot -> deterministic test -> security and
license review -> baseline/custom comparison -> A0/A2 decision -> implementation`

Refresh prior research only where version, maintenance, security, API,
licensing, or platform assumptions became unstable. See
`references/project-priorities.md` for Sky's native-first discovery surfaces.

## Verification Commands

- `node scripts/reuse/validate-packet.mjs <research-packet.json>`
- `npm run reuse:certify`
- `npm run skills:validate`
- `npm run host:check`
- `npm run agents:parity`

## Stop Conditions

Stop on two rounds without materially better evidence, a clearly dominant
native option, obviously smaller/safer custom code, universal hard-requirement
failure, missing business authority, Production access, or any requested write.

## Evidence Format

One compact JSON packet conforming to `.agents/reuse/packet.schema.json`, with
explicit tradeoffs and no aggregate vanity score.

## Handoff Format

Return `REUSE_EXISTING`, `USE_NATIVE`, `ADOPT`, `ADAPT`, `BUILD_CUSTOM`, `DEFER`,
or `REJECT`, plus reasons, rejected candidates, risks, proof required before
adoption, and rollback/exit strategy. R0 never approves the recommendation.
