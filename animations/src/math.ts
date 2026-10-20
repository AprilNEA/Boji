// Vector math, easing, two-bone inverse kinematics and phase timelines.
// Screen coordinates: x right, y down. Angles in degrees, clockwise from +x.

export type Vec2 = [number, number];

export const D2R = Math.PI / 180;
export const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Vec2, k: number): Vec2 => [a[0] * k, a[1] * k];
export const dot = (a: Vec2, b: Vec2): number => a[0] * b[0] + a[1] * b[1];
export const len = (a: Vec2): number => Math.hypot(a[0], a[1]);
export const norm = (a: Vec2): Vec2 => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const dir = (deg: number): Vec2 => [Math.cos(deg * D2R), Math.sin(deg * D2R)];
export const ang = (v: Vec2): number => Math.atan2(v[1], v[0]) / D2R;
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerpV = (a: Vec2, b: Vec2, t: number): Vec2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const clamp = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, x));
export const smooth = (x: number): number => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
export const easeIO = (x: number): number => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const sineIO = (x: number): number => { x = clamp(x, 0, 1); return -(Math.cos(Math.PI * x) - 1) / 2; };
export const rotate = (v: Vec2, deg: number): Vec2 => { const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };

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

/** Two-bone IK from root A toward target T. Clamps unreachable targets and records a warning. */
export function ik2(A: Vec2, T: Vec2, l1: number, l2: number, bend: number, tag = ''): IKResult {
  const d = sub(T, A);
  let dist = len(d);
  const maxd = l1 + l2 - 1e-4;
  const mind = Math.abs(l1 - l2) + 1e-4;
  if (dist > maxd + 0.5 || dist < mind - 0.5) IK_WARNINGS.push(`${tag} unreachable: dist=${dist.toFixed(1)} range=[${mind.toFixed(1)}, ${maxd.toFixed(1)}]`);
  dist = clamp(dist, mind, maxd);
  const base = ang(d);
  const cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const a = Math.acos(clamp(cosA, -1, 1)) / D2R;
  const a1 = base + bend * a;
  const J = add(A, mul(dir(a1), l1));
  const end = add(A, mul(dir(base), dist));
  const a2 = ang(sub(end, J));
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

export function timeline(segs: Segment[]): Timeline {
  const total = segs.reduce((s, x) => s + x.d, 0);
  return {
    total,
    at(t) {
      let x = (((t % 1) + 1) % 1) * total;
      for (const s of segs) {
        if (x <= s.d + 1e-9) {
          const u = s.d ? x / s.d : 1;
          const f = s.ease === 'linear' ? u : s.ease === 'sine' ? sineIO(u) : easeIO(u);
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
