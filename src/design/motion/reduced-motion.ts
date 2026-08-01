import { useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";

export function useReducedMotionPreference(): boolean {
  return useReducedMotion() ?? false;
}

export const reducedMotionFallbackVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0 },
  },
};

export function getReducedMotionVariant(
  variant: Variants,
  shouldReduce: boolean
): Variants {
  if (!shouldReduce) return variant;

  const safeVariant: Variants = {};
  for (const key in variant) {
    if (Object.prototype.hasOwnProperty.call(variant, key)) {
      const state = variant[key];
      if (typeof state === "object" && state !== null) {
        const { x, y, scale, rotate, transition, ...rest } = state as Record<string, unknown>;
        void x;
        void y;
        void scale;
        void rotate;
        void transition;

        safeVariant[key] = {
          ...rest,
          transition: { duration: 0 },
        };
      } else {
        safeVariant[key] = state;
      }
    }
  }
  return safeVariant;
}

export { useReducedMotion };
