export const EASE_APPLE = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const SPRING_SOFT = { type: "spring", stiffness: 140, damping: 22, mass: 0.9 } as const;
export const SPRING_SNAPPY = { type: "spring", stiffness: 320, damping: 30 } as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};
