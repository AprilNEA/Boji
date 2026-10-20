// Bezier paths, Lottie shape primitives and keyframe reduction.
import { D2R, len, sub, type Vec2 } from './math.ts';

/** A Lottie JSON object (shape item, layer, transform). The output is plain JSON. */
export type LottieObject = { [key: string]: unknown };

/** Lottie Bezier path: vertices with in and out tangents relative to each vertex. */
export interface BezierPath {
  c: boolean;
  v: Vec2[];
  i: Vec2[];
  o: Vec2[];
}

/** Lottie property: static (`a: 0`) or keyframed (`a: 1`). */
export type Prop = { a: 0; k: unknown } | { a: 1; k: LottieObject[] };

export type Sample = number | Vec2 | BezierPath;

// ---------- Paths ----------
const r2 = (x: number): number => Math.round(x * 100) / 100;
const rp = (p: Vec2): Vec2 => [r2(p[0]), r2(p[1])];

interface Vertex {
  p: Vec2;
  i: Vec2;
  o: Vec2;
}

export class PathBuilder {
  v: Vertex[] = [];
  move(p: Vec2): this { this.v.push({ p, i: [0, 0], o: [0, 0] }); return this; }
  line(p: Vec2): this { this.v.push({ p, i: [0, 0], o: [0, 0] }); return this; }
  /** Arc around center c from angle a0 to a1 (degrees). The last vertex must lie at a0. */
  arc(c: Vec2, r: number, a0: number, a1: number): this {
    const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90));
    const d = (a1 - a0) / n;
    const h = (4 / 3) * Math.tan((Math.abs(d) * D2R) / 4) * r * Math.sign(d);
    for (let k = 0; k < n; k++) {
      const t0 = (a0 + d * k) * D2R;
      const t1 = (a0 + d * (k + 1)) * D2R;
      const last = this.v[this.v.length - 1]!;
      last.o = [-Math.sin(t0) * h, Math.cos(t0) * h];
      const p: Vec2 = [c[0] + r * Math.cos(t1), c[1] + r * Math.sin(t1)];
      this.v.push({ p, i: [Math.sin(t1) * h, -Math.cos(t1) * h], o: [0, 0] });
    }
    return this;
  }
  build(): BezierPath {
    const v = this.v.slice();
    const f = v[0]!, l = v[v.length - 1]!;
    if (len(sub(f.p, l.p)) < 0.01) { f.i = l.i; v.pop(); }
    return { c: true, v: v.map((x) => rp(x.p)), i: v.map((x) => rp(x.i)), o: v.map((x) => rp(x.o)) };
  }
}

/** Tapered capsule along +y from (0, y0) with radius r0 to (0, y0 + L) with radius r1. */
export function capsule(L: number, r0: number, r1: number, y0 = 0): BezierPath {
  const ny = (r0 - r1) / L;
  const nx = Math.sqrt(Math.max(0, 1 - ny * ny));
  const phi = Math.atan2(ny, nx) / D2R;
  const c0: Vec2 = [0, y0], c1: Vec2 = [0, y0 + L];
  return new PathBuilder()
    .move([r0 * nx, y0 + r0 * ny])
    .line([r1 * nx, y0 + L + r1 * ny])
    .arc(c1, r1, phi, 180 - phi)
    .line([-r0 * nx, y0 + r0 * ny])
    .arc(c0, r0, 180 - phi, 360 + phi)
    .build();
}

/** Closed Catmull-Rom spline through points. `sharp` lists vertex indexes without tangents. */
export function smoothClosed(pts: Vec2[], sharp: number[] = [], k = 1 / 6): BezierPath {
  const n = pts.length;
  const v: Vec2[] = [], i: Vec2[] = [], o: Vec2[] = [];
  for (let j = 0; j < n; j++) {
    const p = pts[j]!;
    if (sharp.includes(j)) { v.push(rp(p)); i.push([0, 0]); o.push([0, 0]); continue; }
    const prev = pts[(j - 1 + n) % n]!, next = pts[(j + 1) % n]!;
    const t: Vec2 = [(next[0] - prev[0]) * k, (next[1] - prev[1]) * k];
    v.push(rp(p)); i.push(rp([-t[0], -t[1]])); o.push(rp(t));
  }
  return { c: true, v, i, o };
}

// ---------- Lottie primitives ----------
export function hexColor(h: string): number[] {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1].map((x) => Math.round(x * 10000) / 10000);
}
export const fill = (hex: string, nm = 'Fill'): LottieObject => ({ ty: 'fl', nm, c: { a: 0, k: hexColor(hex) }, o: { a: 0, k: 100 }, r: 1, bm: 0 });
export const stroke = (hex: string, w: number, nm = 'Stroke'): LottieObject => ({ ty: 'st', nm, c: { a: 0, k: hexColor(hex) }, o: { a: 0, k: 100 }, w: { a: 0, k: w }, lc: 2, lj: 2, bm: 0 });

export interface TransformInit {
  p?: Vec2;
  r?: number;
  /** Opacity in percent, or an animated property. */
  o?: number | Prop;
}
export function tr({ p = [0, 0], r = 0, o = 100 }: TransformInit = {}): LottieObject {
  return {
    ty: 'tr', nm: 'Transform',
    p: { a: 0, k: rp(p) }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] },
    r: { a: 0, k: r2(r) }, o: typeof o === 'number' ? { a: 0, k: o } : o,
    sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 },
  };
}
export const group = (nm: string, items: LottieObject[], transform: LottieObject = tr()): LottieObject => ({ ty: 'gr', nm, it: [...items, transform], np: items.length, cix: 2, bm: 0 });
export const pathShape = (path: BezierPath, nm = 'Path'): LottieObject => ({ ty: 'sh', nm, ks: { a: 0, k: path } });
export const animPathShape = (prop: Prop, nm = 'Path'): LottieObject => ({ ty: 'sh', nm, ks: prop });
export const ellipse = (c: Vec2, s: Vec2, nm = 'Ellipse'): LottieObject => ({ ty: 'el', nm, p: { a: 0, k: rp(c) }, s: { a: 0, k: rp(s) }, d: 1 });
export const rect = (c: Vec2, s: Vec2, r = 0, nm = 'Rect'): LottieObject => ({ ty: 'rc', nm, p: { a: 0, k: rp(c) }, s: { a: 0, k: rp(s) }, r: { a: 0, k: r }, d: 1 });

// Filled shape group helpers.
export const blob = (nm: string, hex: string, path: BezierPath): LottieObject => group(nm, [pathShape(path), fill(hex)]);
export const oval = (nm: string, hex: string, c: Vec2, s: Vec2, r = 0): LottieObject => group(nm, [ellipse([0, 0], s), fill(hex)], tr({ p: c, r }));
export const box = (nm: string, hex: string, c: Vec2, s: Vec2, radius = 0, r = 0): LottieObject => group(nm, [rect([0, 0], s, radius), fill(hex)], tr({ p: c, r }));

// ---------- Keyframe reduction ----------
function flatten(v: Sample): number[] {
  if (typeof v === 'number') return [v];
  if (Array.isArray(v)) return v;
  return [...v.v.flat(), ...v.i.flat(), ...v.o.flat()];
}
function fits(vals: number[][], i: number, j: number, tol: number): boolean {
  for (let k = i + 1; k < j; k++) {
    const u = (k - i) / (j - i);
    const a = vals[i]!, b = vals[j]!, c = vals[k]!;
    for (let d = 0; d < c.length; d++) {
      if (Math.abs(a[d]! + (b[d]! - a[d]!) * u - c[d]!) > tol) return false;
    }
  }
  return true;
}
/** Indexes of the samples to keep so linear interpolation stays within `tol` of every sample. */
function reduce(vals: number[][], tol: number): number[] {
  const keep = [0];
  let i = 0;
  const n = vals.length;
  while (i < n - 1) {
    let j = i + 1;
    while (j + 1 < n && fits(vals, i, j + 1, tol)) j++;
    keep.push(j);
    i = j;
  }
  return keep;
}

export type SampleKind = 'scalar' | 'pos' | 'path';

/** Build a property from per-frame samples (frame 0..N) with linear keyframes. */
export function animProp(samples: number[], kind: 'scalar', tol: number): Prop;
export function animProp(samples: Vec2[], kind: 'pos', tol: number): Prop;
export function animProp(samples: BezierPath[], kind: 'path', tol: number): Prop;
export function animProp(samples: Sample[], kind: SampleKind, tol: number): Prop {
  const flat = samples.map(flatten);
  const first = flat[0]!;
  const isStatic = flat.every((v) => v.every((x, d) => Math.abs(x - first[d]!) <= tol));
  const val = (s: Sample): unknown => (kind === 'scalar' ? r2(s as number) : kind === 'pos' ? rp(s as Vec2) : s);
  if (isStatic) return { a: 0, k: val(samples[0]!) };
  const keep = reduce(flat, tol);
  const k = keep.map((idx, j) => {
    const s = samples[idx]!;
    const kf: LottieObject = { t: idx, s: kind === 'scalar' ? [r2(s as number)] : kind === 'pos' ? rp(s as Vec2) : [s] };
    if (j < keep.length - 1) {
      if (kind === 'scalar') { kf.i = { x: [1], y: [1] }; kf.o = { x: [0], y: [0] }; }
      else { kf.i = { x: 1, y: 1 }; kf.o = { x: 0, y: 0 }; }
      if (kind === 'pos') { kf.to = [0, 0]; kf.ti = [0, 0]; }
    }
    return kf;
  });
  return { a: 1, k };
}

/** Unwrap a list of angles so consecutive values never jump by more than 180°. */
export function unwrap(list: number[]): number[] {
  const out = [list[0]!];
  for (let i = 1; i < list.length; i++) {
    let a = list[i]!;
    const prev = out[i - 1]!;
    while (a - prev > 180) a -= 360;
    while (a - prev < -180) a += 360;
    out.push(a);
  }
  return out;
}

export function shapeLayer(ind: number, nm: string, shapes: LottieObject[], ks: LottieObject, op: number): LottieObject {
  return { ddd: 0, ind, ty: 4, nm, sr: 1, ks, ao: 0, shapes, ip: 0, op, st: 0, bm: 0 };
}
export function transformKS({ p, r, o }: { p?: Prop; r?: Prop; o?: Prop }): LottieObject {
  return {
    o: o ?? { a: 0, k: 100 },
    r: r ?? { a: 0, k: 0 },
    p: p ?? { a: 0, k: [0, 0] },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: [100, 100] },
  };
}
