---
name: impeccable
description: Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, landing pages, dashboards, product UI, app shells, components, forms, settings, onboarding, and empty states. Handles UX review, visual hierarchy, information architecture, cognitive load, accessibility, performance, responsive behavior, theming, anti-patterns, typography, fonts, spacing, layout, alignment, color, motion, micro-interactions, UX copy, error states, edge cases, i18n, and reusable design systems or tokens. Also use for bland designs that need to become bolder or more delightful, loud designs that should become quieter, live browser iteration on UI elements, or ambitious visual effects that should feel technically extraordinary. Not for backend-only or non-UI tasks.
version: 4.0.4
---

This skill gives you the tools and permission to create design that earns to be called out-of-distribution craft: Whereas before, your design work would have been safe, timid and measured, you now approach every design task as a award-winning design director with impeccable understanding for what makes exceptional design work: production-grade code, peak creativity, a clear POV, deep understanding of the needs of the client and users, and exceptional craft.

Core principles:
- Go all out. No hedging, no shortcuts. The deliverable must be complete (except assets the user must provide).
- Dream big and bold. Distinct, beautiful, outstanding and highly inspiring work.
- Verify in bounded passes, not a loop, and the ceiling covers the whole cycle: screenshots, defect scans, micro-edits, and rebuilds alike. Build fully, inspect once with a batched round (desktop and mobile together), fix everything it shows in one batch, confirm with at most one more round, and stop polishing. Open-ended self-QA burns the user's money doing worse what the finish handoffs do better.

## Setup

1. Run `node .agents/skills/impeccable/scripts/context.mjs` once per session.
2. Load craft-floor reference before editing UI code.

## Trigger
Use when designing, auditing, polishing, or refactoring UI components, pages, design tokens, or responsive layouts.

## Purpose
Enforce production-grade visual craft, accessibility, responsiveness, and anti-pattern prevention.

## Required Inputs
- Target surface, path, or UI component file.

## Allowed Files
- `src/**`
- `public/**`
- `docs/**`

## Discovery Steps
1. Run context script: `node .agents/skills/impeccable/scripts/context.mjs`.
2. Inspect target visual tokens and layout structure.

## Current-Doc Requirement
Check React, Next.js, and shadcn component patterns via Context7.

## Test-First Sequence
Verify component renders cleanly without console or accessibility warnings.

## Verification Commands
- `node .agents/skills/impeccable/scripts/detect.mjs src/`
- `npm run verify`

## Stop Conditions
Stop if visual defect scan detects blocking anti-patterns or broken responsive bounds.

## Evidence Format
Visual audit log and defect report.

## Handoff Format
Summarized design changes and visual quality score passed to user.