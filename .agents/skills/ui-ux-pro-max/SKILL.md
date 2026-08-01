---
name: ui-ux-pro-max
description: Pro Max UI/UX design, motion design, micro-interactions, CRO optimization, and accessible responsive aesthetics.
---

## Trigger
Use when building or refining user interfaces requiring world-class UI/UX design, motion animation, micro-interactions, responsive layouts, or conversion-rate optimization (CRO).

## Purpose
Enforces top-tier design aesthetics, smooth `motion/react` spring physics, accessibility (WCAG 2.2 AA), semantic color tokens, and high-conversion visual hierarchy.

## Required Inputs
- Target page or component path (e.g., `src/app/page.tsx`, `src/components/ui/card.tsx`)
- Design goals (e.g., CRO, motion reveals, responsive layout, dark/light mode elegance)

## Allowed Files
- `src/app/**/*.tsx`
- `src/components/**/*.tsx`
- `src/design/**/*.ts`
- `src/design/**/*.tsx`

## Discovery Steps
1. Inspect design tokens in `src/app/globals.css` and `src/design/motion/tokens.ts`.
2. Verify semantic theme classes (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`).
3. Check motion primitives (`MotionReveal`, `MotionStagger`, `MotionPressable`).

## Current-Doc Requirement
Check `motion/react` and Next.js 16 App Router component guidelines via official Context7 / standard docs when incorporating complex animation states.

## Test-First Sequence
1. Ensure motion components support `reducedMotion` accessibility (`src/design/motion/reduced-motion.ts`).
2. Write unit tests for component rendering and interaction in `src/__tests__/motion.test.ts` or `src/__tests__/ui.test.ts`.

## Verification Commands
- `npm run verify`
- `npm run typecheck`
- `npm test`

## Stop Conditions
- All 11 test suites pass with 0 errors.
- Visual hierarchy is rich, responsive, and uses semantic design tokens.
- No raw unapproved color utilities or unverified marketing claims.

## Evidence Format
- List of modified UI/UX components
- Summary of motion animations applied
- Test & build execution output

## Handoff Format
- Clean git branch with passed verification checks.
