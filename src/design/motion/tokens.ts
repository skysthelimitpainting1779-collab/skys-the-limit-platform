export const motionSprings = {
  smooth: { type: "spring", stiffness: 100, damping: 15, mass: 1 },
  snappy: { type: "spring", stiffness: 300, damping: 25, mass: 0.8 },
  bouncy: { type: "spring", stiffness: 400, damping: 15, mass: 1 },
  gentle: { type: "spring", stiffness: 120, damping: 20, mass: 1 },
} as const;

export const motionDurations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

export const motionStaggers = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.15,
} as const;

export const motionEasings = {
  easeOut: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
  sharp: [0.4, 0, 0.2, 1] as const,
};

export const motionTokens = {
  springs: motionSprings,
  durations: motionDurations,
  staggers: motionStaggers,
  easings: motionEasings,
} as const;
