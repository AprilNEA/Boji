// Easing, keyframes and phase timelines: how a movement progresses over its loop.
//
// d3-ease gives the easing curves, d3-scale maps progress to keyframe segments and d3-interpolate interpolates
// numbers. Points interpolate with lerpV from vec2.ts.
import { easeCubicInOut, easeLinear, easeSinIn, easeSinInOut, easeSinOut } from 'd3-ease';
import { interpolateNumber } from 'd3-interpolate';
import { scaleLinear } from 'd3-scale';
import { clamp, lerp, lerpV, type Vec2 } from './vec2.ts';

/** An easing function: maps progress in [0, 1] to eased progress. */
export type Ease = (t: number) => number;

export { easeCubicInOut, easeLinear, easeSinIn, easeSinInOut, easeSinOut };

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
