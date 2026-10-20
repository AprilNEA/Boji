// Vector math, easing, keyframes, two-bone inverse kinematics and phase timelines.
// Screen coordinates: x right, y down. Angles in degrees, clockwise from +x.
//
// Libraries do the math: gl-matrix for vectors, d3-ease for easing curves, d3-interpolate and d3-scale for
// interpolation and keyframes, es-toolkit for clamping. Vec2 stays a plain [x, y] tuple, so exercise files can
// write points as literals. The functions below only adapt the library calls to degrees and tuples.
import { easeCubicInOut, easeLinear, easeSinIn, easeSinInOut, easeSinOut } from 'd3-ease';
import { interpolateNumber } from 'd3-interpolate';
import { scaleLinear } from 'd3-scale';
import { clamp } from 'es-toolkit';
import { glMatrix, vec2 } from 'gl-matrix';

export type Vec2 = [number, number];
/** An easing function: maps progress in [0, 1] to eased progress. */
export type Ease = (t: number) => number;

export { clamp };
export { easeCubicInOut, easeLinear, easeSinIn, easeSinInOut, easeSinOut };

const out = (): Vec2 => [0, 0];
const ORIGIN: Vec2 = [0, 0];
/** Degrees to radians. */
export const D2R = glMatrix.toRadian(1);

export const add = (a: Vec2, b: Vec2): Vec2 => vec2.add(out(), a, b) as Vec2;
export const sub = (a: Vec2, b: Vec2): Vec2 => vec2.subtract(out(), a, b) as Vec2;
export const mul = (a: Vec2, k: number): Vec2 => vec2.scale(out(), a, k) as Vec2;
/** a + b * k. */
export const addScaled = (a: Vec2, b: Vec2, k: number): Vec2 => vec2.scaleAndAdd(out(), a, b, k) as Vec2;
export const dot = (a: Vec2, b: Vec2): number => vec2.dot(a, b);
export const len = (a: Vec2): number => vec2.length(a);
export const dist = (a: Vec2, b: Vec2): number => vec2.distance(a, b);
export const norm = (a: Vec2): Vec2 => vec2.normalize(out(), a) as Vec2;
/** Rotate v by deg degrees around the origin. Positive turns clockwise on screen. */
export const rotate = (v: Vec2, deg: number): Vec2 => vec2.rotate(out(), v, ORIGIN, glMatrix.toRadian(deg)) as Vec2;
/** Unit vector that points in direction deg. */
export const dir = (deg: number): Vec2 => rotate([1, 0], deg);
/** Point at distance r from p in direction deg. */
export const polar = (p: Vec2, deg: number, r: number): Vec2 => addScaled(p, dir(deg), r);
/** v with x multiplied by f: f = -1 mirrors a direction for equipment that faces left. */
export const mirrorX = (v: Vec2, f: number): Vec2 => vec2.multiply(out(), v, [f, 1]) as Vec2;
/** Direction of v in degrees, in (-180, 180]. */
export const ang = (v: Vec2): number => Math.atan2(v[1], v[0]) / D2R;
/** Angle between two vectors in degrees, in [0, 180]. */
export const angleBetween = (a: Vec2, b: Vec2): number => vec2.angle(a, b) / D2R;
export const lerp = (a: number, b: number, t: number): number => interpolateNumber(a, b)(t);
export const lerpV = (a: Vec2, b: Vec2, t: number): Vec2 => vec2.lerp(out(), a, b, t) as Vec2;

/** Smoothstep (3x² − 2x³) on x clamped to [0, 1]. Equal to the CSS easing cubic-bezier(1/3, 0, 2/3, 1). */
export const smooth = (x: number): number => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
/** Cubic ease-in-out on x clamped to [0, 1]. */
export const easeIO = (x: number): number => easeCubicInOut(clamp(x, 0, 1));
/** Sine ease-in-out on x clamped to [0, 1]. */
export const sineIO = (x: number): number => easeSinInOut(clamp(x, 0, 1));

/**
 * Keyframed value over progress t. `stops` lists [t, value] pairs in increasing t; values are numbers or Vec2.
 * Between two stops the value follows `ease` (one easing for every segment, or one per segment). Outside the
 * first and last stop it holds. Angles must be continuous: write 170 → 190, not 170 → -170.
 */
export function keyframes<T extends number | Vec2>(stops: readonly (readonly [number, T])[], ease: Ease | readonly Ease[] = easeCubicInOut): (t: number) => T {
  if (stops.length < 2) throw new Error('keyframes: give at least two stops');
  const index = scaleLinear().domain(stops.map(([t]) => t)).range(stops.map((_, i) => i)).clamp(true);
  // Numbers use d3-interpolate. Points use gl-matrix, which returns a new tuple per call; d3's array
  // interpolator would reuse one array for every call.
  const segment = (a: T, b: T): ((u: number) => T) =>
    typeof a === 'number' ? (interpolateNumber(a, b as number) as unknown as (u: number) => T) : (u) => lerpV(a as Vec2, b as Vec2, u) as T;
  const segments = stops.slice(1).map(([, b], i) => segment(stops[i]![1], b));
  const easeOf = (i: number): Ease => (typeof ease === 'function' ? ease : ease[i] ?? easeCubicInOut);
  return (t) => {
    const x = index(t);
    const i = Math.min(Math.floor(x), segments.length - 1);
    return segments[i]!(easeOf(i)(x - i));
  };
}

/** There and back: 0 at t = 0 and t = 1, 1 at t = 0.5, linear in between. */
export const pingPong = keyframes([[0, 0], [0.5, 1], [1, 0]], easeLinear);
/** Half sine bump: 0 at t = 0 and t = 1, 1 at t = 0.5. Equal to sin(π t) on [0, 1]. */
export const bump = keyframes([[0, 0], [0.5, 1], [1, 0]], [easeSinOut, easeSinIn]);
/** Smooth breath cycle: 0 at t = 0 and t = 1, 1 at t = 0.5. Equal to (1 − cos 2π t) / 2 on [0, 1]. */
export const breath = keyframes([[0, 0], [0.5, 1], [1, 0]], easeSinInOut);

/** Unreachable IK targets found since the last reset. `compose` clears and reads this list per animation. */
export const IK_WARNINGS: string[] = [];

/** Pick the bend sign so the middle joint lies on the side of `side`. */
export function bendFor(A: Vec2, T: Vec2, side: Vec2): 1 | -1 {
  const perp = dir(ang(sub(T, A)) + 90);
  return dot(side, perp) >= 0 ? 1 : -1;
}

export interface IKResult {
  /** Direction of the first bone, in degrees. */
  a1: number;
  /** Direction of the second bone, in degrees. */
  a2: number;
  /** Middle joint. */
  J: Vec2;
}

/**
 * Two-bone IK from root A toward target T: the law of cosines gives the angle at the root.
 * Clamps unreachable targets and records a warning.
 */
export function ik2(A: Vec2, T: Vec2, l1: number, l2: number, bend: number, tag = ''): IKResult {
  const d = sub(T, A);
  let reach = len(d);
  const maxd = l1 + l2 - 1e-4;
  const mind = Math.abs(l1 - l2) + 1e-4;
  if (reach > maxd + 0.5 || reach < mind - 0.5) IK_WARNINGS.push(`${tag} unreachable: dist=${reach.toFixed(1)} range=[${mind.toFixed(1)}, ${maxd.toFixed(1)}]`);
  reach = clamp(reach, mind, maxd);
  const base = ang(d);
  const cosA = (l1 * l1 + reach * reach - l2 * l2) / (2 * l1 * reach);
  const a = Math.acos(clamp(cosA, -1, 1)) / D2R;
  const a1 = base + bend * a;
  const J = polar(A, a1, l1);
  const a2 = ang(sub(polar(A, base, reach), J));
  return { a1, a2, J };
}

/** One phase of a movement. `p` eases from `from` to `to`; effort `e` blends between its two values. */
export interface Segment {
  /** Duration in seconds. */
  d: number;
  from: number;
  to: number;
  /** Default: cubic ease-in-out. */
  ease?: 'linear' | 'sine';
  /** Muscle effort at the start and end of the phase, 0 to 1. */
  e?: [number, number];
}

export interface Phase {
  p: number;
  e: number;
  seg: Segment;
  u: number;
}

export interface Timeline {
  /** Loop length in seconds. */
  total: number;
  /** Phase at normalized loop time t in [0, 1). */
  at(t: number): Phase;
}

const SEGMENT_EASE: Record<NonNullable<Segment['ease']> | 'cubic', Ease> = { linear: easeLinear, sine: easeSinInOut, cubic: easeCubicInOut };

export function timeline(segs: Segment[]): Timeline {
  const total = segs.reduce((s, x) => s + x.d, 0);
  return {
    total,
    at(t) {
      let x = (((t % 1) + 1) % 1) * total;
      for (const s of segs) {
        if (x <= s.d + 1e-9) {
          const u = s.d ? x / s.d : 1;
          const f = SEGMENT_EASE[s.ease ?? 'cubic'](clamp(u, 0, 1));
          const e = s.e ? lerp(s.e[0], s.e[1], sineIO(u)) : 0;
          return { p: lerp(s.from, s.to, f), e, seg: s, u };
        }
        x -= s.d;
      }
      const s = segs[segs.length - 1]!;
      return { p: s.to, e: s.e ? s.e[1] : 0, seg: s, u: 1 };
    },
  };
}
