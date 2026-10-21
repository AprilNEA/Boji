// Bezier paths, Lottie shape primitives and keyframe reduction.
// Libraries draw the paths: d3-path for lines and arcs, d3-shape for Catmull-Rom curves, svgpath to turn arcs into
// cubic Bezier segments, and d3-color to parse colors. `fromSvgPath` converts any SVG path to a Lottie path.
import { rgb } from 'd3-color';
import { path as d3path, type Path } from 'd3-path';
import { curveCardinal, curveCardinalClosed, type CurveFactory } from 'd3-shape';
import { round } from 'es-toolkit';
import svgpath from 'svgpath';
import { D2R, ang, dist, sub, type Vec2 } from '@/math/vec2.ts';

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
const r2 = (x: number): number => round(x, 2);
const rp = (p: Vec2): Vec2 => [r2(p[0]), r2(p[1])];
const ZERO = (): Vec2 => [0, 0];

interface Vertex {
  p: Vec2;
  i: Vec2;
  o: Vec2;
}

const toBezierPath = (v: Vertex[], c: boolean): BezierPath => ({ c, v: v.map((x) => rp(x.p)), i: v.map((x) => rp(x.i)), o: v.map((x) => rp(x.o)) });

/**
 * Path context for d3 that records vertices with in and out tangents instead of drawing. d3-shape curves draw into
 * it directly, so per-frame paths need no SVG string.
 */
class VertexRecorder {
  readonly v: Vertex[] = [];
  closed = false;
  moveTo(x: number, y: number): void {
    if (this.v.length) throw new Error('VertexRecorder: one subpath only');
    this.v.push({ p: [x, y], i: ZERO(), o: ZERO() });
  }
  lineTo(x: number, y: number): void { this.v.push({ p: [x, y], i: ZERO(), o: ZERO() }); }
  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void {
    const last = this.v[this.v.length - 1]!;
    last.o = sub([x1, y1], last.p);
    const p: Vec2 = [x, y];
    this.v.push({ p, i: sub([x2, y2], p), o: ZERO() });
  }
  closePath(): void { this.closed = true; }
}

/** Vertices of one SVG subpath: M, L, C, A and Z commands. svgpath turns arcs into cubic segments. */
function svgVertices(d: string): VertexRecorder {
  const rec = new VertexRecorder();
  svgpath(d).abs().unarc().iterate((seg) => {
    const [cmd, ...n] = seg as [string, ...number[]];
    if (cmd === 'M') rec.moveTo(n[0]!, n[1]!);
    else if (cmd === 'L') rec.lineTo(n[0]!, n[1]!);
    else if (cmd === 'C') rec.bezierCurveTo(n[0]!, n[1]!, n[2]!, n[3]!, n[4]!, n[5]!);
    else if (cmd === 'Z') rec.closePath();
    else throw new Error(`fromSvgPath: unsupported command ${cmd}`);
  });
  return rec;
}

/** Vertices of a d3-shape curve through pts. */
function traceCurve(factory: CurveFactory, pts: Vec2[]): Vertex[] {
  const rec = new VertexRecorder();
  const curve = factory(rec as unknown as Path);
  curve.lineStart();
  for (const [x, y] of pts) curve.point(x, y);
  curve.lineEnd();
  return rec.v;
}

/** Merge a closing vertex that repeats the first vertex: the first vertex takes its in tangent. */
function mergeClosing(v: Vertex[]): void {
  const f = v[0]!, l = v[v.length - 1]!;
  if (v.length > 1 && dist(f.p, l.p) < 0.01) { f.i = l.i; v.pop(); }
}

/** Lottie path from one SVG subpath. `closed` defaults to the subpath's Z command. */
export function fromSvgPath(d: string, closed?: boolean): BezierPath {
  const r = svgVertices(d);
  const c = closed ?? r.closed;
  if (c) mergeClosing(r.v);
  return toBezierPath(r.v, c);
}

/** Closed path from lines and arcs, drawn with d3-path. */
export class PathBuilder {
  private readonly d = d3path();
  move(p: Vec2): this { this.d.moveTo(p[0], p[1]); return this; }
  line(p: Vec2): this { this.d.lineTo(p[0], p[1]); return this; }
  /** Arc around center c from angle a0 to a1 (degrees, clockwise on screen when a1 > a0). The path must be at a0. */
  arc(c: Vec2, r: number, a0: number, a1: number): this { this.d.arc(c[0], c[1], r, a0 * D2R, a1 * D2R, a1 < a0); return this; }
  build(): BezierPath { return fromSvgPath(this.d.toString(), true); }
}

/** Tapered capsule along +y from (0, y0) with radius r0 to (0, y0 + L) with radius r1. */
export function capsule(L: number, r0: number, r1: number, y0 = 0): BezierPath {
  // Unit normal of the side lines, which touch both end circles.
  const ny = (r0 - r1) / L;
  const nx = Math.sqrt(Math.max(0, 1 - ny * ny));
  const phi = ang([nx, ny]);
  const c0: Vec2 = [0, y0], c1: Vec2 = [0, y0 + L];
  return new PathBuilder()
    .move([r0 * nx, y0 + r0 * ny])
    .line([r1 * nx, y0 + L + r1 * ny])
    .arc(c1, r1, phi, 180 - phi)
    .line([-r0 * nx, y0 + r0 * ny])
    .arc(c0, r0, 180 - phi, 360 + phi)
    .build();
}

// Uniform Catmull-Rom splines: cardinal curves with tension 0.
const CATMULL_ROM_CLOSED = curveCardinalClosed.tension(0);
const CATMULL_ROM_OPEN = curveCardinal.tension(0);

/** Closed Catmull-Rom spline through points. `sharp` lists vertex indexes without tangents. */
export function smoothClosed(pts: Vec2[], sharp: number[] = []): BezierPath {
  const v = traceCurve(CATMULL_ROM_CLOSED, pts);
  mergeClosing(v);
  // d3 starts the closed curve at the second point. Restore the order of pts.
  v.unshift(v.pop()!);
  for (const j of sharp) { v[j]!.i = ZERO(); v[j]!.o = ZERO(); }
  return toBezierPath(v, true);
}

/** Open Catmull-Rom curve through pts. The end points have no tangents. */
export function smoothOpen(pts: Vec2[]): BezierPath {
  const v = traceCurve(CATMULL_ROM_OPEN, pts);
  v[0]!.o = ZERO();
  v[v.length - 1]!.i = ZERO();
  return toBezierPath(v, false);
}

// ---------- Lottie primitives ----------
/** Straight polygon or polyline through pts. */
export const polyPath = (pts: Vec2[], closed: boolean): BezierPath => ({ c: closed, v: pts.map(rp), i: pts.map(ZERO), o: pts.map(ZERO) });

/** Lottie color: [r, g, b, a] in [0, 1]. */
export function hexColor(h: string): number[] {
  const c = rgb(h);
  return [c.r / 255, c.g / 255, c.b / 255, 1].map((x) => round(x, 4));
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
/** Group transform with animated position, scale and opacity. Scale and opacity are in percent. */
export function trAnim({ p, s, o }: { p?: Prop; s?: Prop; o?: Prop }): LottieObject {
  return {
    ty: 'tr', nm: 'Transform',
    p: p ?? { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: s ?? { a: 0, k: [100, 100] },
    r: { a: 0, k: 0 }, o: o ?? { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 },
  };
}
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

/** 'pos': spatial 2D value with motion tangents. 'vec': non-spatial 2D value such as scale. */
export type SampleKind = 'scalar' | 'pos' | 'vec' | 'path';

/** Build a property from per-frame samples (frame 0..N) with linear keyframes. */
export function animProp(samples: number[], kind: 'scalar', tol: number): Prop;
export function animProp(samples: Vec2[], kind: 'pos', tol: number): Prop;
export function animProp(samples: Vec2[], kind: 'vec', tol: number): Prop;
export function animProp(samples: BezierPath[], kind: 'path', tol: number): Prop;
export function animProp(samples: Sample[], kind: SampleKind, tol: number): Prop {
  const flat = samples.map(flatten);
  const first = flat[0]!;
  const isStatic = flat.every((v) => v.every((x, d) => Math.abs(x - first[d]!) <= tol));
  const val = (s: Sample): unknown => (kind === 'scalar' ? r2(s as number) : kind === 'pos' || kind === 'vec' ? rp(s as Vec2) : s);
  if (isStatic) return { a: 0, k: val(samples[0]!) };
  const keep = reduce(flat, tol);
  const k = keep.map((idx, j) => {
    const s = samples[idx]!;
    const kf: LottieObject = { t: idx, s: kind === 'scalar' ? [r2(s as number)] : kind === 'pos' || kind === 'vec' ? rp(s as Vec2) : [s] };
    if (j < keep.length - 1) {
      if (kind === 'scalar') { kf.i = { x: [1], y: [1] }; kf.o = { x: [0], y: [0] }; }
      else if (kind === 'vec') { kf.i = { x: [1, 1], y: [1, 1] }; kf.o = { x: [0, 0], y: [0, 0] }; }
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
export function transformKS({ p, r, o, s }: { p?: Prop; r?: Prop; o?: Prop; s?: Prop }): LottieObject {
  return {
    o: o ?? { a: 0, k: 100 },
    r: r ?? { a: 0, k: 0 },
    p: p ?? { a: 0, k: [0, 0] },
    a: { a: 0, k: [0, 0] },
    s: s ?? { a: 0, k: [100, 100] },
  };
}
