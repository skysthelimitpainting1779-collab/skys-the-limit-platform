"use client";

import { motion, useReducedMotion } from "motion/react";
import React from "react";
import { motionSprings } from "./tokens";

export interface MotionPressableProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  scaleHover?: number;
  scaleTap?: number;
}

export function MotionPressable({
  children,
  className,
  onClick,
  disabled = false,
  scaleHover = 1.02,
  scaleTap = 0.98,
}: MotionPressableProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion || disabled) {
    return (
      <div
        className={className}
        onClick={disabled ? undefined : onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: scaleHover }}
      whileTap={{ scale: scaleTap }}
      transition={motionSprings.snappy}
      onClick={onClick}
      className={className}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </motion.div>
  );
}
