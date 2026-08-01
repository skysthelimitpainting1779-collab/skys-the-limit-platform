## 2026-08-01T18:02:00Z

<USER_REQUEST>
You are Worker 1 (`worker_m2_motion_ui`) for Sky's the Limit Platform Foundation setup.
Working directory: C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_m2_motion_ui\
Work Node ID: node-m2-motion-ui

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY CONTEXT7 PROTOCOL:
You MUST use Context7 MCP (`resolve-library-id` + `query-docs`) for third-party library documentation research (specifically for `motion/react`, Next.js 16 App Router, and shadcn styling patterns) before writing code.

Your Tasks:
1. Research `motion/react` API in Context7 (`resolve-library-id` for `motion` or `framer-motion` -> query `motion/react` v12 usage and `useReducedMotion`).
2. Complete all required motion primitive files in `src/design/motion/`:
   - `tokens.ts`: Spring physics presets, durations, stagger timings.
   - `variants.ts`: Reusable animation variants (fade, slideUp, scale, staggerContainer) for `motion/react`.
   - `reduced-motion.ts`: Hook/utility for `useReducedMotion` and safe fallback variants.
   - `Reveal.tsx`: MotionReveal component respecting reduced motion settings.
   - `Stagger.tsx`: MotionStagger container component.
   - `Pressable.tsx`: MotionPressable component with micro-interaction hover/tap feedback.
   - `index.ts`: Barrel export exporting all tokens, variants, hooks, and components.
   - MANDATORY: Import ONLY from `"motion/react"`. NEVER import from `"framer-motion"`.
3. Create all 7 missing App Router route shells in `src/app/` (so all 8 required routes exist):
   - `residential/page.tsx` (`/residential`)
   - `commercial/page.tsx` (`/commercial`)
   - `public-sector/page.tsx` (`/public-sector`)
   - `estimate/page.tsx` (`/estimate`)
   - `customer/page.tsx` (`/customer`)
   - `crew/page.tsx` (`/crew`)
   - `operations/page.tsx` (`/operations`)
   (Ensure `/` `src/app/page.tsx` is also intact and clean).
4. Initialize `components.json` (shadcn config) at root and create `src/lib/utils.ts` (`cn` helper using `clsx` and `tailwind-merge`) if missing.
5. Create core shadcn UI components in `src/components/ui/` (`button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `dialog.tsx`).
6. Run `npm run typecheck` and `npm test` to verify zero TypeScript errors and all tests passing.
7. Write your handoff report to `C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_m2_motion_ui\handoff.md`. Send a message when finished.
</USER_REQUEST>
