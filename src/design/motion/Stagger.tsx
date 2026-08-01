"use client";

import { motion, useReducedMotion } from "motion/react";
import React from "react";
import { motionStaggers } from "./tokens";
import { staggerContainerVariants, staggerItemVariants } from "./variants";

export interface MotionStaggerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
  once?: boolean;
}

export function MotionStagger({
  children,
  className,
  staggerDelay = motionStaggers.normal,
  delay = 0,
  once = true,
}: MotionStaggerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const customVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      variants={customVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface MotionStaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function MotionStaggerItem({ children, className }: MotionStaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}
