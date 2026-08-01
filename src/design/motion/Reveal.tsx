"use client";

import { motion, useReducedMotion } from "motion/react";
import React from "react";
import { motionDurations, motionEasings } from "./tokens";

export interface MotionRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number | "some" | "all";
}

export function MotionReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = motionDurations.normal,
  once = true,
  amount = 0.2,
}: MotionRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = 16;
  const initialCoordinates = {
    up: { y: offset, x: 0 },
    down: { y: -offset, x: 0 },
    left: { x: offset, y: 0 },
    right: { x: -offset, y: 0 },
    none: { x: 0, y: 0 },
  }[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...initialCoordinates }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: motionEasings.easeOut,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
