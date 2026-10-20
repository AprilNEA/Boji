// Machine kit: frame, pads and moving arms for selectorized and plate-loaded machines. Every family builds its
// machines from these parts, so machines look alike across the library. Use weightStack from core.ts for the stack.
// Colors: main frame metal, brackets and secondary frame metalDark, near pads pad, far or hidden pads padFar,
// foot plates metalDark, loaded plates plate. Sizes: 2.09 px per cm (thigh 94 px is about 45 cm).
import type { MovingPart, PropShape, RigidPart } from '@/exercise.ts';
import { add, ang, dir, len, lerpV, mul, sub, type Vec2 } from '@/math.ts';
import type { Palette } from '@/palettes.ts';
import type { Joints } from '@/rig.ts';
import { G } from '@/exercises/common.ts';
import { plateEdge, type PlateSize } from './free-weights.ts';

/** Default frame tube width: about 7 cm. */
export const TUBE = 14;
/** Seat height of most selectorized machines, top of the pad above the floor: about 48 cm. */
export const SEAT_TOP = 100;

/** Straight frame tube from a to b with round ends. dark: secondary tube in metalDark. */
export const tube = (pal: Palette, nm: string, a: Vec2, b: Vec2, opts: { w?: number; dark?: boolean } = {}): PropShape => {
  const w = opts.w ?? TUBE;
  const d = sub(b, a);
  return { kind: 'box', nm, color: opts.dark ? pal.metalDark : pal.metal, c: lerpV(a, b, 0.5), s: [len(d) + w, w], r: w / 2, rot: ang(d) };
};

/** Floor rail between x0 and x1. */
export const baseRail = (pal: Palette, x0: number, x1: number, nm = 'base'): PropShape =>
  ({ kind: 'box', nm, color: pal.metalDark, c: [(x0 + x1) / 2, G - 5], s: [x1 - x0, 10], r: 3 });

/** Upholstered pad centered at c, size s (long side first), rotated rot degrees. far: the darker far-side tone. */
export const pad = (pal: Palette, nm: string, c: Vec2, s: Vec2, rot = 0, far = false): PropShape =>
  ({ kind: 'box', nm, color: far ? pal.padFar : pal.pad, c, s, r: Math.min(s[0], s[1]) / 2, rot });

/** Seat pad whose top surface is at y = top, centered at x. */
export const seatPad = (pal: Palette, x: number, top = G - SEAT_TOP, length = 94, nm = 'seat'): PropShape =>
  pad(pal, nm, [x, top + 8], [length, 16]);

/** Round foam roller pad seen end-on (side view), for leg curls, leg extensions, hip machines and ankle holds. */
export const rollerEnd = (pal: Palette, nm: string, c: Vec2, d = 30): PropShape[] => [
  { kind: 'oval', nm, color: pal.pad, c, s: [d, d] },
  { kind: 'oval', nm: `${nm}-hub`, color: pal.metalDark, c, s: [d * 0.3, d * 0.3] },
];

/** Foam roller pad seen lengthwise (front view): a short horizontal pad. */
export const rollerLong = (pal: Palette, nm: string, c: Vec2, length = 70, d = 30): PropShape =>
  ({ kind: 'box', nm, color: pal.pad, c, s: [length, d], r: d / 2 });

/** Foot plate of a leg press, calf press or hack squat. s: [thickness, length]; rot turns the long side. */
export const footPlate = (pal: Palette, nm: string, c: Vec2, s: Vec2 = [10, 110], rot = 0): PropShape =>
  ({ kind: 'box', nm, color: pal.metalDark, c, s, r: 3, rot });

/** Fixed pivot hub. */
export const hub = (pal: Palette, nm: string, c: Vec2, d = 22): PropShape[] => [
  { kind: 'oval', nm, color: pal.metalDark, c, s: [d, d] },
  { kind: 'oval', nm: `${nm}-cap`, color: pal.metal, c, s: [d * 0.4, d * 0.4] },
];

/** Handle grip: a short dark bar centered at c along direction rot, for machine handles seen from the side. */
export const grip = (pal: Palette, nm: string, c: Vec2, length = 36, rot = 90): PropShape =>
  ({ kind: 'box', nm, color: pal.padFar, c, s: [length, 10], r: 5, rot });

/** End point of a lever of `length` from `pivot` at angle a degrees (0 = +x, y down). Use it for IK targets. */
export const leverEnd = (pivot: Vec2, length: number, a: number): Vec2 => add(pivot, mul(dir(a), length));

export interface LeverSpec<J> {
  nm: string;
  pivot: Vec2;
  /** Pivot to the working end (pad, handle or foot plate), in px. */
  length: number;
  /** Arm angle at loop time t, degrees. Usually derived from the joint the arm follows. */
  angle: (J: J, t: number) => number;
  z?: MovingPart['z'];
  w?: number;
  /** Extra shapes in local coordinates: the arm runs from the origin along +x to [length, 0]. */
  extra?: (pal: Palette) => PropShape[];
}

/** Lever arm that rotates about a fixed pivot, such as a leg extension, leg curl, pec deck or plate-loaded arm. */
export function leverArm<J = Joints>({ nm, pivot, length, angle, z = 'back', w = TUBE, extra }: LeverSpec<J>): RigidPart<J> {
  return {
    nm, z, kind: 'rigid',
    shapes: (pal) => [
      { kind: 'box', nm: 'arm', color: pal.metal, c: [length / 2, 0], s: [length + w, w], r: w / 2 },
      ...(extra?.(pal) ?? []),
      { kind: 'oval', nm: 'arm-hub', color: pal.metalDark, c: [0, 0], s: [w + 8, w + 8] },
    ],
    at: (J, t) => ({ p: pivot, a: angle(J, t) }),
  };
}

/** Plates loaded on a plate horn at local position c, perpendicular to direction rot (for plate-loaded arms). */
export const loadedPlates = (pal: Palette, c: Vec2, rot: number, size: PlateSize = 'full', count = 2): PropShape[] => {
  const along = dir(rot), out: PropShape[] = [];
  for (let k = 0; k < count; k++) {
    const p = add(c, mul(along, (k - (count - 1) / 2) * 12));
    const e = plateEdge(pal, size, p, `loaded-plate-${k}`);
    out.push(e.kind === 'box' ? { ...e, rot: (e.rot ?? 0) + rot } : e);
  }
  return out;
};
