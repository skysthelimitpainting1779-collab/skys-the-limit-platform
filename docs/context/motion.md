# Motion / Framer Motion Contract — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/grx7/framer-motion`
- **Official Source:** https://motion.dev
- **Decision Affected:** Animation tokens, spring physics, and accessible reduced-motion support.

## Key Contracts
1. **Universal Spring Configuration:** Use `type: "spring"` with `stiffness: 300`, `damping: 25` for snappy physics.
2. **Reduced Motion Accessibility:** Wrap motion hierarchies in `<MotionConfig reducedMotion="user" />` to respect user system motion preferences.
3. **Restrained Portal Motion:** Restrict animations in portal views to essential state transitions and feedback micro-interactions.
