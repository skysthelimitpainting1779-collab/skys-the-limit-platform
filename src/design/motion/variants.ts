import type { Variants } from "motion/react";
import { motionDurations, motionEasings, motionStaggers } from "./tokens";

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasings.easeInOut,
    },
  },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasings.easeInOut,
    },
  },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasings.easeInOut,
    },
  },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasings.easeInOut,
    },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: motionStaggers.normal,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: motionStaggers.fast,
      staggerDirection: -1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: {
      duration: motionDurations.fast,
    },
  },
};

export const motionVariants = {
  fadeIn: fadeInVariants,
  slideUp: slideUpVariants,
  slideDown: slideDownVariants,
  scale: scaleVariants,
  staggerContainer: staggerContainerVariants,
  staggerItem: staggerItemVariants,
} as const;
