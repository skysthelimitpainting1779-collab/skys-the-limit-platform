# Motion for React Context & Contract

- **Research Date**: 2026-07-31
- **Official Source**: Motion for React (`motion/react`)
- **Selected Version / Contract**: `motion/react` v12+
- **Decision Affected**: UI animations, page transitions, reduced-motion handling.
- **Important Constraints**:
  - Always import from `"motion/react"` (never legacy `framer-motion`).
  - Respect `useReducedMotion()` and accessibility guidelines.
  - Transform and opacity animations first for performance.
