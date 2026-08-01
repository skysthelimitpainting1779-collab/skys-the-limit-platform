import { describe, it, expect } from "vitest";
import {
  motionTokens,
  motionSprings,
  motionDurations,
  motionStaggers,
  motionEasings,
  motionVariants,
  fadeInVariants,
  slideUpVariants,
  slideDownVariants,
  scaleVariants,
  staggerContainerVariants,
  staggerItemVariants,
  reducedMotionFallbackVariants,
  getReducedMotionVariant,
} from "@/design/motion";

describe("Motion Primitives Suite", () => {
  it("exports motion design tokens correctly", () => {
    expect(motionSprings.snappy).toHaveProperty("type", "spring");
    expect(motionDurations.normal).toBe(0.3);
    expect(motionStaggers.normal).toBe(0.1);
    expect(motionEasings.easeOut).toBeDefined();
    expect(motionTokens.springs).toEqual(motionSprings);
  });

  it("exports valid motion variants", () => {
    expect(fadeInVariants).toHaveProperty("hidden");
    expect(fadeInVariants).toHaveProperty("visible");
    expect(slideUpVariants).toHaveProperty("hidden");
    expect(slideDownVariants).toHaveProperty("hidden");
    expect(scaleVariants).toHaveProperty("hidden");
    expect(staggerContainerVariants).toHaveProperty("visible");
    expect(staggerItemVariants).toHaveProperty("hidden");

    expect(motionVariants.fadeIn).toBe(fadeInVariants);
    expect(motionVariants.slideUp).toBe(slideUpVariants);
  });

  it("handles reduced motion variant transformation properly", () => {
    expect(reducedMotionFallbackVariants.visible).toHaveProperty("opacity", 1);

    const transformVariant = {
      hidden: { opacity: 0, y: 20, scale: 0.9 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
    };

    const reduced = getReducedMotionVariant(transformVariant, true);
    expect(reduced.hidden).not.toHaveProperty("y");
    expect(reduced.hidden).not.toHaveProperty("scale");
    expect(reduced.hidden).toHaveProperty("opacity", 0);
    expect(reduced.visible).toHaveProperty("transition", { duration: 0 });

    const normal = getReducedMotionVariant(transformVariant, false);
    expect(normal).toBe(transformVariant);
  });
});
