---
name: impeccable
description: Use when designing, redesigning, polishing, or optimizing frontend interfaces, visual hierarchy, micro-interactions, responsive layouts, or CRO.
---

## Trigger
Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface.

## Purpose
Provides complete design system guidance, visual hierarchy, motion animation standards, responsive layout structures, and accessibility rules for production interfaces.

## Required Inputs
- Target surface or component path (e.g., `src/app/page.tsx`, `src/components/ui/card.tsx`)
- Design intent and mode (Persuade, Operate, Read, Experience)

## Allowed Files
- `src/app/**/*.tsx`
- `src/components/**/*.tsx`
- `src/design/**/*.ts`
- `src/design/**/*.tsx`
- `.agents/skills/impeccable/**`

## Discovery Steps
1. Run `node .agents/skills/impeccable/scripts/context.mjs` if present to load product and design context.
2. Inspect target visual tokens in `src/app/globals.css` and `src/design/motion/tokens.ts`.
3. Check component accessibility and WCAG 2.2 AA contrast requirements.

## Current-Doc Requirement
Check Next.js 16 App Router, Tailwind CSS, and `motion/react` official documentation via Context7 or standard docs before implementing complex animation effects.

## Test-First Sequence
1. Ensure motion components respect `reducedMotion` preferences (`src/design/motion/reduced-motion.ts`).
2. Verify visual component rendering and interactions via Vitest test suite (`npm test`).

## Verification Commands
- `npm run verify:skills`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Stop Conditions
- `validate-skills.mjs` passes 100% with 0 errors.
- Visual hierarchy and contrast satisfy WCAG 2.2 AA.
- All 11 Vitest test suites pass.

## Evidence Format
- List of modified UI/UX components
- Summary of design adjustments and motion animations
- Test and build execution output

## Handoff Format
- Clean git branch with verified commit SHA and passing CI checks.