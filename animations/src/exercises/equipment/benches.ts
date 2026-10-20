// Benches for both views. Side view: x values are screen x. Front view: screen x relative to the body midline,
// usually 0. Heights are px above the ground (2.09 px per cm). Every bench returns static shapes for Props.back,
// its x range for Exercise.propsBox, and the geometry an exercise needs to place the body on the pads.
import { add, D2R, dir, mirrorX, mul, type Vec2 } from '@/math.ts';
import type { PropShape } from '@/exercise.ts';
import type { Palette } from '@/palettes.ts';
import { G } from '@/exercises/common.ts';

/** Flat bench: pad top 43 cm, pad 6 cm thick, 120 cm long, 28 cm wide. */
export const BENCH = { top: 90, pad: 13, length: 250, width: 58 } as const;

export interface Bench {
  draw: (pal: Palette) => PropShape[];
  box: [number, number];
  /** Screen y of the seat or pad top surface. */
  seatY: number;
}

export interface FlatBenchSpec {
  view: 'side' | 'front';
  /** Side: center of the pad. Front: center of the pad, seen end-on. */
  x: number;
  top?: number;
  length?: number;
}

/** Flat bench. Side view: the pad runs along x. Front view: the pad points at the viewer. */
export function flatBench({ view, x, top = BENCH.top, length = BENCH.length }: FlatBenchSpec): Bench {
  const y = G - top, P = BENCH.pad;
  if (view === 'front') {
    return {
      seatY: y,
      box: [x - 48, x + 48],
      draw: (pal) => [
        { kind: 'box', nm: 'bench-foot', color: pal.metalDark, c: [x, G - 4], s: [96, 8], r: 3 },
        { kind: 'box', nm: 'bench-post', color: pal.metalDark, c: [x, (y + P + G) / 2], s: [12, G - y - P], r: 2 },
        { kind: 'box', nm: 'bench-pad', color: pal.pad, c: [x, y + P / 2], s: [BENCH.width, P], r: 5 },
      ],
    };
  }
  const legX = (s: number): number => x + s * (length / 2 - 34);
  return {
    seatY: y,
    box: [x - length / 2, x + length / 2],
    draw: (pal) => [
      ...[-1, 1].flatMap((s): PropShape[] => [
        { kind: 'box', nm: `bench-foot-${s}`, color: pal.metalDark, c: [legX(s), G - 4], s: [50, 8], r: 3 },
        { kind: 'box', nm: `bench-leg-${s}`, color: pal.metalDark, c: [legX(s), (y + P + G) / 2], s: [10, G - y - P], r: 2 },
      ]),
      { kind: 'box', nm: 'bench-rail', color: pal.metalDark, c: [x, y + P + 5], s: [length - 50, 9], r: 3 },
      { kind: 'box', nm: 'bench-pad', color: pal.pad, c: [x, y + P / 2], s: [length, P], r: 6 },
    ],
  };
}

export interface InclineSpec {
  /** Screen x of the hinge between seat and backrest. */
  x: number;
  /** Backrest angle above horizontal: 0 flat, 30 low incline, 45 incline, 60 to 75 steep, 90 upright. */
  angle: number;
  /** Seat top above the ground. */
  top?: number;
  /** Backrest and seat pad lengths. */
  back?: number;
  seat?: number;
  /** Direction the user faces: 1 to the right (backrest on the left), -1 to the left. */
  facing?: 1 | -1;
}

export interface InclineBench extends Bench {
  /** Hinge point on the pad surface. */
  hinge: Vec2;
  /** Unit vector from the hinge up the backrest surface. */
  backDir: Vec2;
  /** Unit normal of the backrest surface, pointing toward the user. Torso back = surface + normal * 16. */
  normal: Vec2;
}

/** Adjustable bench, side view. The backrest rises from the hinge behind the user. */
export function inclineBench({ x, angle, top = BENCH.top, back = 165, seat = 72, facing = 1 }: InclineSpec): InclineBench {
  const P = BENCH.pad, f = facing;
  const hinge: Vec2 = [x, G - top];
  const backDir = mirrorX(dir(180 + angle), f);
  const normal = mirrorX(dir(angle - 90), f);
  const restC = add(add(hinge, mul(backDir, back / 2 + 3)), mul(normal, -P / 2));
  // Rotation of a box whose long axis lies along backDir.
  const rot = f === 1 ? angle : -angle;
  const strutTop = add(hinge, mul(backDir, back * 0.45));
  const box: [number, number] = f === 1 ? [hinge[0] + backDir[0] * back - 10, x + seat + 10] : [x - seat - 10, hinge[0] + backDir[0] * back + 10];
  return {
    hinge, backDir, normal, seatY: G - top, box,
    draw: (pal) => [
      { kind: 'box', nm: 'bench-foot', color: pal.metalDark, c: [x - f * 40, G - 4], s: [170, 8], r: 3 },
      { kind: 'box', nm: 'bench-post', color: pal.metalDark, c: [x + f * 18, (G - top + P + G) / 2], s: [10, top - P], r: 2 },
      // Rear strut from the floor to the middle of the backrest.
      ...(angle > 5 ? [{
        kind: 'poly' as const, nm: 'bench-strut', color: pal.metalDark, w: 8,
        pts: [[x - f * 92, G - 6], add(strutTop, mul(normal, -P - 2))] as Vec2[],
      }] : []),
      { kind: 'box', nm: 'bench-seat', color: pal.pad, c: [x + f * (seat / 2 - 2), G - top + P / 2], s: [seat, P], r: 6 },
      { kind: 'box', nm: 'bench-back', color: pal.pad, c: restC, s: [back, P], r: 6, rot },
    ],
  };
}

export interface DeclineSpec {
  /** Screen x of the low (head) end of the pad. */
  x: number;
  /** Pad angle below horizontal toward the head, in degrees. Typical 15 to 25. */
  angle?: number;
  /** Height of the pad surface at the low end, above the ground. */
  low?: number;
  length?: number;
  /** Direction from the head end to the foot end: 1 to the right. */
  facing?: 1 | -1;
}

export interface DeclineBench extends Bench {
  /** Pad surface at the head end and at the foot end. */
  head: Vec2;
  foot: Vec2;
  /** Unit normal of the pad surface, pointing up. Torso back = surface + normal * 16. */
  normal: Vec2;
  /** Center of the ankle roller; the user hooks the ankles under it. */
  roller: Vec2;
}

/** Decline bench, side view: the head end is low, the feet hook under a roller at the high end. */
export function declineBench({ x, angle = 20, low = 70, length = 220, facing = 1 }: DeclineSpec): DeclineBench {
  const P = BENCH.pad, f = facing;
  const head: Vec2 = [x, G - low];
  const along = mirrorX(dir(-angle), f);
  // Up from the pad surface; the pad rises toward the feet, so the normal leans toward the head.
  const normal = mirrorX(dir(-angle - 90), f);
  const foot = add(head, mul(along, length));
  const padC = add(add(head, mul(along, length / 2)), mul(normal, -P / 2));
  const roller = add(add(foot, mul(along, 22)), mul(normal, -24));
  return {
    head, foot, normal, roller, seatY: head[1], box: f === 1 ? [x - 10, roller[0] + 22] : [roller[0] - 22, x + 10],
    draw: (pal) => [
      { kind: 'box', nm: 'bench-foot-head', color: pal.metalDark, c: [x + f * 30, G - 4], s: [50, 8], r: 3 },
      { kind: 'box', nm: 'bench-leg-head', color: pal.metalDark, c: [x + f * 30, (G + head[1]) / 2 + 4], s: [10, G - head[1] - 8], r: 2 },
      { kind: 'box', nm: 'bench-foot-foot', color: pal.metalDark, c: [foot[0] - f * 10, G - 4], s: [50, 8], r: 3 },
      { kind: 'box', nm: 'bench-leg-foot', color: pal.metalDark, c: [foot[0] - f * 10, (G + foot[1]) / 2 + 6], s: [10, G - foot[1] - 12], r: 2 },
      { kind: 'poly', nm: 'roller-arm', color: pal.metalDark, w: 7, pts: [add(foot, mul(normal, -P)), roller] },
      { kind: 'box', nm: 'bench-pad', color: pal.pad, c: padC, s: [length, P], r: 6, rot: f === 1 ? -angle : angle },
      { kind: 'oval', nm: 'roller', color: pal.padFar, c: roller, s: [26, 26] },
    ],
  };
}

export interface PreacherSpec {
  /** Screen x of the pad's top edge, where the armpits rest. */
  x: number;
  /** Screen y of the pad's top edge. Seated: about chest height. */
  y: number;
  /** Pad angle from vertical, sloping away from the user. Typical 40 to 50. */
  angle?: number;
  /** Seat top above the ground. */
  seatTop?: number;
  /** Screen x of the seat center. */
  seatX: number;
  facing?: 1 | -1;
}

export interface PreacherBench extends Bench {
  /** Unit vector from the top edge down the pad surface. */
  padDir: Vec2;
  /** Pad surface normal toward the user; the upper arm lies on surface + normal * 8. */
  normal: Vec2;
  top: Vec2;
}

/** Preacher curl bench, side view: an angled arm pad in front of a seat. */
export function preacherBench({ x, y, angle = 45, seatTop = 96, seatX, facing = 1 }: PreacherSpec): PreacherBench {
  const f = facing, L = 92, P = 14;
  const top: Vec2 = [x, y];
  const padDir = mirrorX(dir(90 - angle), f);
  // The upper arm lies on the upper face of the sloping pad.
  const normal = mirrorX(dir(-angle), f);
  const padC = add(add(top, mul(padDir, L / 2)), mul(normal, -P / 2));
  const base: Vec2 = add(top, mul(padDir, L));
  const seatY = G - seatTop;
  return {
    top, padDir, normal, seatY, box: f === 1 ? [seatX - 50, base[0] + 30] : [base[0] - 30, seatX + 50],
    draw: (pal) => [
      { kind: 'box', nm: 'preacher-foot', color: pal.metalDark, c: [(seatX + base[0]) / 2, G - 4], s: [Math.abs(base[0] - seatX) + 80, 8], r: 3 },
      { kind: 'box', nm: 'preacher-post', color: pal.metalDark, c: [base[0] + f * 6, (base[1] + G) / 2], s: [11, G - base[1]], r: 2 },
      { kind: 'box', nm: 'seat-post', color: pal.metalDark, c: [seatX, (seatY + G) / 2], s: [10, G - seatY], r: 2 },
      { kind: 'box', nm: 'seat', color: pal.pad, c: [seatX, seatY + 7], s: [76, 14], r: 6 },
      { kind: 'box', nm: 'preacher-pad', color: pal.pad, c: padC, s: [P, L], r: 6, rot: f === 1 ? -angle : angle },
    ],
  };
}
