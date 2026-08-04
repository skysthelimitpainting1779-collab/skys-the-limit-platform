# Motion (`motion/react`) — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/motion/motion`
- **Version:** Motion 12.x (`motion/react`)
- **Official Source:** https://motion.dev
- **Decision Affected:** Animation tokens, spring physics, hero interactions, layout animations, and accessible reduced-motion support.

## Key Contracts & Implementation Patterns

1. **Import Source Compliance:**
   - All motion primitives and hooks MUST be imported from `"motion/react"`.
   - Direct imports from `"framer-motion"` are strictly prohibited by repo rules.

2. **Universal Physics Tokens:**
   - Spring physics standard: `type: "spring"`, `stiffness: 300`, `damping: 25` for responsive micro-interactions.
   - Smooth entrance transitions: `duration: 0.3`, `ease: [0.16, 1, 0.3, 1]`.

3. **Accessibility & Reduced Motion:**
   - Enforce reduced motion settings globally using `<MotionConfig reducedMotion="user" />`.
   - Components read `useReducedMotion()` to disable or simplify opacity/transform transitions when requested by OS settings.

4. **Non-Blocking Interaction:**
   - UI animations must never delay user interaction, prevent form submission, or hijack native browser scrolling.

5. **Hardware Acceleration:**
   - Use GPU-accelerated CSS properties (`opacity`, `transform`) to ensure constant 60fps performance without triggering re-layouts.
