// Small equipment for both views: stability ball, foam roller and resistance bands.
// Each ball or roller has local shapes centered on the origin; use them as a moving part, or with place() as a
// static prop.
import { range } from 'es-toolkit';
import { add, lerpV, mul, norm, sub, type Vec2 } from '@/math/vec2.ts';
import { bump } from '@/math/timeline.ts';
import type { Cable, Curve, PropShape, RigidPart } from '@/exercise.ts';
import type { Palette } from '@/draw/palettes.ts';

type At<J> = (J: J, t: number) => { p: Vec2; a?: number };

/** Stability ball, 65 cm. Center it BALL.r above the ground when it rests on the floor. */
export const BALL = { d: 136, r: 68 } as const;

export const ballShapes = (pal: Palette, d: number = BALL.d): PropShape[] => [
  { kind: 'oval', nm: 'ball', color: pal.ball, c: [0, 0], s: [d, d] },
  { kind: 'oval', nm: 'ball-shine', color: pal.ballShine, c: [-d * 0.2, -d * 0.24], s: [d * 0.22, d * 0.13], rot: -35 },
];

export const stabilityBall = <J>(at: At<J>, z: RigidPart['z'] = 'back', d: number = BALL.d): RigidPart<J> =>
  ({ nm: 'Stability Ball', kind: 'rigid', z, at, shapes: (pal) => ballShapes(pal, d) });

/** Foam roller, 15 cm by 90 cm. Center it ROLLER.r above the ground when it rests on the floor. */
export const ROLLER = { d: 31, r: 15.5, length: 188 } as const;

/** 'end': seen end-on (side view). 'long': the roller runs across the screen along local x (front view). */
export const rollerShapes = (pal: Palette, view: 'end' | 'long'): PropShape[] => view === 'end'
  ? [
    { kind: 'oval', nm: 'roller', color: pal.roller, c: [0, 0], s: [ROLLER.d, ROLLER.d] },
    { kind: 'ring', nm: 'roller-face', color: pal.rollerFace, c: [0, 0], s: [ROLLER.d - 10, ROLLER.d - 10], w: 2 },
  ]
  : [
    { kind: 'box', nm: 'roller', color: pal.roller, c: [0, 0], s: [ROLLER.length, ROLLER.d], r: ROLLER.r },
    { kind: 'box', nm: 'roller-shine', color: pal.rollerFace, c: [0, -6], s: [ROLLER.length - 24, 4], r: 2 },
  ];

export const foamRoller = <J>(at: At<J>, view: 'end' | 'long', z: RigidPart['z'] = 'back'): RigidPart<J> =>
  ({ nm: 'Foam Roller', kind: 'rigid', z, at, shapes: (pal) => rollerShapes(pal, view) });

/** Taut resistance band between two moving points. */
export const bandLine = <J>(at: (J: J, t: number) => [Vec2, Vec2], z: RigidPart['z'] = 'underNearArm', nm = 'Band'): Cable<J> =>
  ({ nm, kind: 'line', z, width: 4.5, color: (pal) => pal.resistBand, at });

/** Resistance band along a curve, for a band that wraps or sags. Keep the point count fixed between frames. */
export const bandCurve = <J>(at: (J: J, t: number) => Vec2[], z: RigidPart['z'] = 'underNearArm', nm = 'Band'): Curve<J> =>
  ({ nm, kind: 'curve', z, width: 4.5, color: (pal) => pal.resistBand, at });

/**
 * Points of a band that sags between a and b when slack. sag = 0 is straight; positive values hang down by that
 * many px at the middle. Returns 5 points, so it fits bandCurve.
 */
export function sagPoints(a: Vec2, b: Vec2, sag: number): Vec2[] {
  const n = norm(sub(b, a));
  // Perpendicular that points down on screen.
  let p: Vec2 = [-n[1], n[0]];
  if (p[1] < 0) p = mul(p, -1);
  return [0, 0.25, 0.5, 0.75, 1].map((u) => add(add(a, mul(sub(b, a), u)), mul(p, sag * 4 * u * (1 - u))));
}

/**
 * Mini band around both legs, seen from the front: a flat loop from point a to point b, such as the outsides of
 * the knees. Returns 7 points for bandCurve, drawn across the front of the legs.
 */
export function miniBandPoints(a: Vec2, b: Vec2, bulge = 4): Vec2[] {
  return range(7).map((i) => i / 6).map((u) => add(lerpV(a, b, u), [0, bulge * bump(u)]));
}
