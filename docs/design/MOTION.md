# Motion Specification — Sky's the Limit Platform

- **Document Version:** 1.0.0
- **Last Updated:** 2026-08-02
- **Scope:** Motion system tokens, physics parameters, micro-interactions, spring dynamics, and accessibility.

---

## 1. Core Motion Mandate

1. **Import Enforcement:**
   ALL motion primitives and animated components MUST import directly from `"motion/react"`.
   ```typescript
   // ALLOWED:
   import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "motion/react";

   // STRICTLY FORBIDDEN:
   import { motion } from "framer-motion"; // VIOLATION
   ```

2. **Purpose-Driven Micro-Interactions:**
   Animations exist to provide functional feedback, visual hierarchy, and polished transitions. Decorative or slow animations that delay user actions are prohibited.

---

## 2. Universal Physics Tokens

```typescript
export const MOTION_TOKENS = {
  spring: {
    snappy: { type: "spring", stiffness: 400, damping: 28 },
    default: { type: "spring", stiffness: 300, damping: 25 },
    gentle: { type: "spring", stiffness: 180, damping: 20 },
  },
  easing: {
    outExponent: [0.16, 1, 0.3, 1],
    inOutQuad: [0.45, 0, 0.55, 1],
  },
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
  },
};
```

---

## 3. Standard Micro-Interactions

### 3.1 Button Tap & Hover Feedback
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  transition={MOTION_TOKENS.spring.snappy}
>
  Get Free Estimate
</motion.button>
```

### 3.2 Card Elevation Lift
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{ duration: 0.35, ease: MOTION_TOKENS.easing.outExponent }}
>
  <Card />
</motion.div>
```

### 3.3 Modal / Sheet Entrance
- Backdrop fade: `opacity` from `0` to `1` over `200ms`.
- Dialog content scaling: `scale` from `0.95` to `1.0` with `MOTION_TOKENS.spring.default`.

---

## 4. Accessibility & Reduced Motion Handling

1. **Global Motion Provider:**
   Wrap the root application layout in `<MotionConfig reducedMotion="user">` to automatically suppress or simplify transform animations when system reduced motion is enabled.

2. **Component Level Checks:**
   ```tsx
   const shouldReduceMotion = useReducedMotion();
   const animation = shouldReduceMotion
     ? { opacity: 1 }
     : { opacity: 1, y: 0 };
   ```

---

## 5. Hardware Acceleration Invariants

- Animate ONLY GPU-accelerated CSS properties: `opacity`, `transform` (`scale`, `translate3d`, `rotate`).
- Avoid animating layout geometry properties (`height`, `width`, `margin`, `padding`) which trigger browser reflow.
- Apply `will-change: transform` sparingly on complex floating overlays.
