// Fixed stations for both views: pull-up bar, dip bars, plyo box, step, cable column with cables and handles,
// and Smith machine rails. Side view: x values are screen x. Front view: screen x relative to the body midline.
// Bar heights are screen y; set them from the hand positions, because a hanging figure decides the height.
import { add, ang, mul, norm, polar, sub, type Vec2 } from '@/math.ts';
import type { Cable, PropShape, RigidPart } from '@/exercise.ts';
import type { Palette } from '@/palettes.ts';
import { G } from '@/exercises/common.ts';

type At<J> = (J: J, t: number) => { p: Vec2; a?: number };

export interface Station {
  draw: (pal: Palette) => PropShape[];
  box: [number, number];
}

/** Pull-up bar with its center at screen point (x, y). Side: the bar points at the viewer. Front: width px wide. */
export function pullUpBar({ view, x = 0, y, width = 250 }: { view: 'side' | 'front'; x?: number; y: number; width?: number }): Station {
  if (view === 'side') {
    const post = x - 46;
    return {
      box: [post - 12, x + 8],
      draw: (pal) => [
        { kind: 'box', nm: 'pullup-foot', color: pal.metalDark, c: [post, G - 4], s: [70, 8], r: 3 },
        { kind: 'box', nm: 'pullup-post', color: pal.metalDark, c: [post, (y - 14 + G) / 2], s: [11, G - y + 14], r: 3 },
        { kind: 'box', nm: 'pullup-arm', color: pal.metalDark, c: [(post + x) / 2, y], s: [x - post, 8], r: 3 },
        { kind: 'oval', nm: 'pullup-bar', color: pal.metal, c: [x, y], s: [10, 10] },
      ],
    };
  }
  const h = width / 2;
  return {
    box: [x - h - 8, x + h + 8],
    draw: (pal) => [
      ...[-1, 1].flatMap((s): PropShape[] => [
        { kind: 'box', nm: `pullup-foot-${s}`, color: pal.metalDark, c: [x + s * h, G - 4], s: [36, 8], r: 3 },
        { kind: 'box', nm: `pullup-post-${s}`, color: pal.metalDark, c: [x + s * h, (y - 12 + G) / 2], s: [12, G - y + 12], r: 3 },
      ]),
      { kind: 'box', nm: 'pullup-bar', color: pal.metal, c: [x, y], s: [width, 8], r: 4 },
    ],
  };
}

/**
 * Parallel dip bars at screen height y. Side: the near bar runs along x, centered at x.
 * Front: two bars point at the viewer, gap px apart (default 55 cm).
 */
export function dipBars({ view, x = 0, y, gap = 115 }: { view: 'side' | 'front'; x?: number; y: number; gap?: number }): Station {
  if (view === 'side') {
    const L = 120;
    return {
      box: [x - L / 2 - 6, x + L / 2 + 6],
      draw: (pal) => [
        ...[-1, 1].flatMap((s): PropShape[] => [
          { kind: 'box', nm: `dip-foot-${s}`, color: pal.metalDark, c: [x + s * (L / 2 - 10), G - 4], s: [44, 8], r: 3 },
          { kind: 'box', nm: `dip-post-${s}`, color: pal.metalDark, c: [x + s * (L / 2 - 10), (y + G) / 2], s: [10, G - y], r: 2 },
        ]),
        { kind: 'box', nm: 'dip-bar', color: pal.metal, c: [x, y], s: [L, 9], r: 4.5 },
      ],
    };
  }
  const h = gap / 2;
  return {
    box: [x - h - 30, x + h + 30],
    draw: (pal) => [
      ...[-1, 1].flatMap((s): PropShape[] => [
        { kind: 'box', nm: `dip-foot-${s}`, color: pal.metalDark, c: [x + s * (h + 14), G - 4], s: [40, 8], r: 3 },
        { kind: 'box', nm: `dip-post-${s}`, color: pal.metalDark, c: [x + s * (h + 14), (y + G) / 2 + 6], s: [10, G - y - 12], r: 2 },
        { kind: 'box', nm: `dip-arm-${s}`, color: pal.metalDark, c: [x + s * (h + 7), y + 6], s: [14, 8], r: 2 },
        { kind: 'oval', nm: `dip-bar-${s}`, color: pal.metal, c: [x + s * h, y], s: [11, 11] },
      ]),
    ],
  };
}

/** Plyo box: default 50 cm high, 60 cm deep (side) or 75 cm wide (front). x: center. */
export function plyoBox({ x, h = 104, w = 125 }: { x: number; h?: number; w?: number }): Station & { top: number } {
  const top = G - h;
  return {
    top,
    box: [x - w / 2, x + w / 2],
    draw: (pal) => [
      { kind: 'box', nm: 'box-body', color: pal.prop, c: [x, top + h / 2], s: [w, h], r: 4 },
      { kind: 'box', nm: 'box-top', color: pal.propLight, c: [x, top + 4], s: [w, 8], r: 4 },
      { kind: 'box', nm: 'box-grip', color: pal.propDark, c: [x, top + h * 0.3], s: [Math.min(36, w * 0.4), 9], r: 4.5 },
    ],
  };
}

/** Aerobic step: default 15 cm high, 90 cm long. x: center. */
export function aerobicStep({ x, h = 31, w = 190 }: { x: number; h?: number; w?: number }): Station & { top: number } {
  const top = G - h;
  return {
    top,
    box: [x - w / 2, x + w / 2],
    draw: (pal) => [
      { kind: 'box', nm: 'step-riser-a', color: pal.propDark, c: [x - w / 2 + 22, top + h / 2 + 3], s: [36, h - 6], r: 3 },
      { kind: 'box', nm: 'step-riser-b', color: pal.propDark, c: [x + w / 2 - 22, top + h / 2 + 3], s: [36, h - 6], r: 3 },
      { kind: 'box', nm: 'step-top', color: pal.pad, c: [x, top + 5], s: [w, 10], r: 4 },
    ],
  };
}

export interface CableColumn extends Station {
  /** Screen point where the cable leaves the pulley. */
  pulley: Vec2;
}

/**
 * Cable column: an upright with a pulley at screen height pulleyY, standing at x.
 * `toward`: direction from the column to the user, 1 right or -1 left; the pulley sits on that side.
 */
export function cableColumn({ x, pulleyY, toward = 1, top = 30 }: { x: number; pulleyY: number; toward?: 1 | -1; top?: number }): CableColumn {
  const px = x + toward * 15;
  const pulley: Vec2 = [px + toward * 2, pulleyY];
  return {
    pulley,
    box: [Math.min(x - 20, px - 12), Math.max(x + 20, px + 12)],
    draw: (pal) => [
      { kind: 'box', nm: 'column-foot', color: pal.metalDark, c: [x, G - 4], s: [64, 8], r: 3 },
      { kind: 'box', nm: 'column', color: pal.prop, c: [x, (top + G) / 2], s: [24, G - top], r: 4 },
      { kind: 'box', nm: 'column-track', color: pal.metalDark, c: [x + toward * 9, (top + G) / 2], s: [4, G - top - 16], r: 2 },
      { kind: 'box', nm: 'pulley-carriage', color: pal.metalDark, c: [x + toward * 8, pulleyY], s: [16, 28], r: 4 },
      { kind: 'oval', nm: 'pulley', color: pal.metal, c: [px, pulleyY], s: [18, 18] },
      { kind: 'oval', nm: 'pulley-hub', color: pal.metalDark, c: [px, pulleyY], s: [6, 6] },
    ],
  };
}

/** Steel cable from a fixed pulley point to a moving attachment point. */
export const cableLine = <J>(from: Vec2, to: (J: J, t: number) => Vec2, nm = 'Cable'): Cable<J> =>
  ({ nm, kind: 'line', z: 'back', width: 2.2, color: (pal) => pal.cable, at: (J, t) => [from, to(J, t)] });

/**
 * Cable attachments. The local origin is the grip and local +y points toward the cable.
 * Rotate with `a` = ang(cable direction) - 90 so the attachment hangs from the cable: see `towardCable`.
 * 'd': single D-handle. 'rope': triceps rope; the origin is the middle of the two knobs, which sit at
 * ±spread px along local x. 'bar': straight or lat bar along local x, len px. 'vbar': close-grip V handle.
 * 'end': a straight bar seen end-on (side view of 'bar').
 */
export function cableHandle<J>(kind: 'd' | 'rope' | 'bar' | 'vbar' | 'end', at: At<J>, opts: { len?: number; spread?: number; z?: RigidPart['z'] } = {}): RigidPart<J> {
  const len = opts.len ?? 84, spread = opts.spread ?? 10;
  const shapes = (pal: Palette): PropShape[] => {
    switch (kind) {
      case 'd': return [
        { kind: 'poly', nm: 'd-frame', color: pal.metal, w: 3, pts: [[-9, 0], [0, 14], [9, 0]] },
        { kind: 'box', nm: 'd-grip', color: pal.pad, c: [0, 0], s: [22, 8], r: 4 },
        { kind: 'oval', nm: 'd-ring', color: pal.metalDark, c: [0, 15], s: [7, 7] },
      ];
      case 'rope': return [
        { kind: 'poly', nm: 'rope', color: pal.cable, w: 5, smooth: true, pts: [[-spread, 0], [-spread * 0.4, 12], [0, 18], [spread * 0.4, 12], [spread, 0]] },
        { kind: 'oval', nm: 'rope-knob-a', color: pal.plate, c: [-spread, 0], s: [9, 9] },
        { kind: 'oval', nm: 'rope-knob-b', color: pal.plate, c: [spread, 0], s: [9, 9] },
      ];
      case 'bar': return [
        { kind: 'box', nm: 'bar', color: pal.metal, c: [0, 0], s: [len, 6], r: 3 },
        { kind: 'box', nm: 'bar-mount', color: pal.metalDark, c: [0, 5], s: [8, 10], r: 2 },
      ];
      case 'vbar': return [
        { kind: 'poly', nm: 'vbar', color: pal.metal, w: 5, pts: [[-12, 0], [0, 14], [12, 0]] },
        { kind: 'box', nm: 'vbar-grip-a', color: pal.pad, c: [-12, -2], s: [8, 14], r: 4 },
        { kind: 'box', nm: 'vbar-grip-b', color: pal.pad, c: [12, -2], s: [8, 14], r: 4 },
      ];
      case 'end': return [
        { kind: 'oval', nm: 'bar-end', color: pal.metal, c: [0, 0], s: [9, 9] },
        { kind: 'box', nm: 'bar-mount', color: pal.metalDark, c: [0, 6], s: [5, 8], r: 2 },
      ];
    }
  };
  return { nm: `Cable ${kind}`, kind: 'rigid', z: opts.z ?? 'underNearArm', shapes, at };
}

/** Rotation that turns a cable attachment's local +y toward the pulley. */
export const towardCable = (grip: Vec2, pulley: Vec2): number => ang(sub(pulley, grip)) - 90;

/** Attachment point of a handle held at `grip` and rotated by `a`: `d` px along local +y. */
export const handleEnd = (grip: Vec2, a: number, d = 15): Vec2 => polar(grip, a + 90, d);

/**
 * Smith machine rails. Side: one rail at x; the bar slides along it. Front: two rails at ±(width/2) with a top
 * frame. Draw the bar with barbell(), its center on the rail line.
 */
export function smithRails({ view, x = 0, top = 26, width = 300 }: { view: 'side' | 'front'; x?: number; top?: number; width?: number }): Station {
  if (view === 'side') {
    return {
      box: [x - 60, x + 60],
      draw: (pal) => [
        { kind: 'box', nm: 'smith-base', color: pal.metalDark, c: [x, G - 4], s: [120, 8], r: 3 },
        { kind: 'box', nm: 'smith-upright', color: pal.prop, c: [x - 46, (top + G) / 2], s: [14, G - top], r: 3 },
        { kind: 'box', nm: 'smith-top', color: pal.prop, c: [x - 20, top + 6], s: [66, 12], r: 3 },
        { kind: 'box', nm: 'smith-rail', color: pal.metal, c: [x, (top + 12 + G) / 2], s: [5, G - top - 12], r: 2.5 },
      ],
    };
  }
  const h = width / 2;
  return {
    box: [x - h - 10, x + h + 10],
    draw: (pal) => [
      { kind: 'box', nm: 'smith-top', color: pal.prop, c: [x, top + 6], s: [width + 24, 12], r: 3 },
      ...[-1, 1].flatMap((s): PropShape[] => [
        { kind: 'box', nm: `smith-base-${s}`, color: pal.metalDark, c: [x + s * h, G - 4], s: [50, 8], r: 3 },
        { kind: 'box', nm: `smith-upright-${s}`, color: pal.prop, c: [x + s * (h + 6), (top + G) / 2], s: [12, G - top], r: 3 },
        { kind: 'box', nm: `smith-rail-${s}`, color: pal.metal, c: [x + s * (h - 8), (top + 12 + G) / 2], s: [5, G - top - 12], r: 2.5 },
      ]),
    ],
  };
}
