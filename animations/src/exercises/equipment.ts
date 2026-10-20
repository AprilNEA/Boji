// Gym machine parts shared by the machine exercises.
import { add, ang, mul, timeline, type Timeline, type Vec2 } from '../math.ts';
import type { PropShape, RigidPart } from '../exercise.ts';
import type { Palette } from '../palettes.ts';
import type { Joints } from '../rig.ts';
import { G } from './common.ts';

/** Concentric 1.0 s, short squeeze, 1.6 s controlled return, short rest. */
export const workTL = (hold = 0.35): Timeline => timeline([
  { d: 1.0, from: 0, to: 1, e: [0.35, 1] },
  { d: hold, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.4] },
  { d: 0.45, from: 0, to: 0, e: [0.4, 0.3] },
]);

export interface WeightStackSpec {
  /** Center x of the plates. */
  x: number;
  /** Top of the frame. */
  top: number;
  plates?: number;
  /** Plates above the pin, which lift with the movement. */
  moving?: number;
  /** Lift height at loop time t. */
  lift: (t: number) => number;
}

export interface WeightStack {
  fixed: (pal: Palette) => PropShape[];
  dynamic: RigidPart;
  /** Horizontal extent, for Exercise.propsBox. */
  box: [number, number];
}

/** Selectorized weight stack. Plates above the pin lift with the movement. */
export function weightStack({ x, top, plates = 12, moving = 5, lift }: WeightStackSpec): WeightStack {
  const w = 46, h = 9, gap = 1.6, base = G;
  const plateY = (i: number): number => base - 8 - (i + 0.5) * (h + gap);
  const restTop = plateY(plates - 1) - h / 2 - 4;
  const pulleyY = top + 18;
  const fixed = (pal: Palette): PropShape[] => [
    { kind: 'box', nm: 'stack-foot', color: pal.metalDark, c: [x, base - 3], s: [w + 24, 6], r: 2 },
    { kind: 'box', nm: 'stack-rail-back', color: pal.metalDark, c: [x - w / 2 - 5, (top + base) / 2], s: [5, base - top], r: 2.5 },
    { kind: 'box', nm: 'stack-rail-front', color: pal.metalDark, c: [x + w / 2 + 5, (top + base) / 2], s: [5, base - top], r: 2.5 },
    { kind: 'box', nm: 'stack-cap', color: pal.metal, c: [x, top + 5], s: [w + 22, 10], r: 3 },
    { kind: 'box', nm: 'stack-cable', color: pal.cable, c: [x, (pulleyY + restTop) / 2], s: [2.2, restTop - pulleyY] },
    { kind: 'oval', nm: 'stack-pulley', color: pal.metalDark, c: [x, pulleyY], s: [18, 18] },
    { kind: 'oval', nm: 'stack-pulley-hub', color: pal.metal, c: [x, pulleyY], s: [6, 6] },
    ...Array.from({ length: plates - moving }, (_, i): PropShape => ({ kind: 'box', nm: `plate-${i}`, color: pal.plate, c: [x, plateY(i)], s: [w, h], r: 1.5 })),
  ];
  const movingShapes = (pal: Palette): PropShape[] => [
    ...Array.from({ length: moving }, (_, k): PropShape => {
      const i = plates - moving + k;
      return { kind: 'box', nm: `plate-${i}`, color: pal.plate, c: [x, plateY(i)], s: [w, h], r: 1.5 };
    }),
    { kind: 'box', nm: 'selector-rod', color: pal.metal, c: [x, restTop + 2], s: [10, 8], r: 2 },
    { kind: 'oval', nm: 'selector-pin', color: pal.accent, c: [x + w / 2 - 6, plateY(plates - moving)], s: [6, 6] },
  ];
  return {
    fixed,
    dynamic: { nm: 'Weight Stack', z: 'back', kind: 'rigid', shapes: movingShapes, at: (_J, t) => ({ p: [0, -lift(t)], a: 0 }) },
    box: [x - w / 2 - 12, x + w / 2 + 12],
  };
}

/** Backrest pad behind the torso at spine position s: center, rotation and size. */
export const backrestAt = (J: Joints, s: number, gapBack = 9, size: Vec2 = [18, 150], shiftUp = 10): { c: Vec2; rot: number; size: Vec2 } => {
  const t = J.T(s), A = J.A(s);
  const c = add(add(J.B(s), mul(A, -(16 + gapBack))), mul(t, shiftUp));
  return { c, rot: ang(t) - 90, size };
};
