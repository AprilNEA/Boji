// Code shared by the side-view composer (side.ts) and the front-view composer (front.ts):
// frame rate, keyframe tolerances, muscle effort, props, floor, moving equipment and the final Lottie object.
import type { Vec2 } from '@/math/vec2.ts';
import { animProp, ellipse, fill, group, pathShape, polyPath, rect, shapeLayer, smoothClosed, smoothOpen, stroke, tr, transformKS, unwrap, type BezierPath, type LottieObject } from '@/draw/lottie.ts';
import { GROUND } from '@/rig/side.ts';
import type { Palette, PaletteName } from '@/draw/palettes.ts';
import type { Exercise, MovingPart, MuscleSpec, PropShape } from '@/exercise.ts';

export const W = 512, H = 512;
export const FPS = 60;
export const TOL = { pos: 0.2, rot: 0.2, opacity: 0.6, path: 0.25, scale: 0.4 };

/** x0, y0, x1, y1. */
export type Box = [number, number, number, number];
export const EMPTY_BOX: Box = [Infinity, Infinity, -Infinity, -Infinity];
export const union = (a: Box, b: Box): Box => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];

export interface LayerDraft {
  nm: string;
  shapes: LottieObject[];
  ks: LottieObject;
}

export interface Composition {
  anim: LottieObject;
  warnings: string[];
  frames: number;
  /** Bounds of figure and props on the canvas after zoom: x0, y0, x1, y1. */
  bbox: number[];
  /** Scale applied to fit the canvas. 1: no scaling. */
  zoom: number;
}

/** Effort 0 to 1 of one highlighted muscle at loop time t. Drives the highlight opacity and the poster frame. */
export function muscleEffort(ex: Exercise, m: MuscleSpec, t: number): number {
  let e: number;
  if (m.e) {
    e = m.e(t);
  } else {
    if (!ex.tl.at) throw new Error(`${ex.id}: muscles without e() need a timeline with at()`);
    e = ex.tl.at(t).e;
  }
  return Math.max(0, Math.min(1, e * (m.scale ?? 1)));
}

/** Highlight opacity property of one muscle: 14 % at rest, 80 % at full effort. */
export const effortOpacity = (ex: Exercise, m: MuscleSpec, ts: number[]) => animProp(ts.map((t) => 14 + 66 * muscleEffort(ex, m, t)), 'scalar', TOL.opacity);

export function propGroup(p: PropShape): LottieObject {
  switch (p.kind) {
    case 'box': return group(p.nm, [rect([0, 0], p.s, p.r ?? 0), fill(p.color)], tr({ p: p.c, r: p.rot ?? 0 }));
    case 'oval': return group(p.nm, [ellipse([0, 0], p.s), fill(p.color)], tr({ p: p.c, r: p.rot ?? 0 }));
    case 'ring': return group(p.nm, [ellipse([0, 0], p.s), stroke(p.color, p.w)], tr({ p: p.c, r: p.rot ?? 0 }));
    case 'poly': {
      const closed = p.closed ?? p.w === undefined;
      const path = p.smooth ? (closed ? smoothClosed(p.pts) : smoothOpen(p.pts)) : polyPath(p.pts, closed);
      return group(p.nm, [pathShape(path), p.w === undefined ? fill(p.color) : stroke(p.color, p.w)]);
    }
  }
}

/**
 * Horizontal offset that centers the figure and props, the box with the props, and the zoom that fits it.
 * zoom < 1 when the figure would cross the top edge or exceed the width; finish() then scales every layer
 * about the ground center, so the floor stays in place.
 */
export function frameOffset(ex: Exercise, figure: Box, warnings: string[]): { ox: number; bb: Box; zoom: number } {
  const b: Box = [...figure];
  if (ex.propsBox) { b[0] = Math.min(b[0], ex.propsBox[0]); b[2] = Math.max(b[2], ex.propsBox[1]); }
  const ox = Math.round(W / 2 - (b[0] + b[2]) / 2);
  const zoomTop = b[1] < 6 ? (GROUND - 6) / (GROUND - b[1]) : 1;
  const zoomWidth = b[2] - b[0] > W - 8 ? (W - 8) / (b[2] - b[0]) : 1;
  const zoom = Math.floor(Math.min(zoomTop, zoomWidth) * 1000) / 1000;
  if (zoom < 0.8) warnings.push(`figure needs zoom ${zoom}; reduce the extent of the pose or the props`);
  return { ox, bb: b, zoom };
}

/** Floor shadow under the figure and props, and the exercise mat. */
export function floorLayer(ex: Exercise, pal: Palette, figure: Box, ox: number): LayerDraft {
  const items: LottieObject[] = [];
  const sx0 = (ex.propsBox ? Math.min(figure[0], ex.propsBox[0]) : figure[0]) + 14;
  const sx1 = (ex.propsBox ? Math.max(figure[2], ex.propsBox[1]) : figure[2]) - 14;
  items.push(group('shadow', [ellipse([0, 0], [sx1 - sx0 + 30, 14]), { ...fill(pal.shadow), o: { a: 0, k: pal.shadowOpacity } }], tr({ p: [(sx0 + sx1) / 2, GROUND + 2] })));
  if (ex.mat) {
    const mx0 = figure[0] - 6, mx1 = figure[2] + 6;
    items.push(group('mat-edge', [rect([0, 0], [mx1 - mx0, 8], 4), fill(pal.matEdge)], tr({ p: [(mx0 + mx1) / 2, GROUND - 3] })));
    items.push(group('mat', [rect([0, 0], [mx1 - mx0, 6], 3), fill(pal.mat)], tr({ p: [(mx0 + mx1) / 2, GROUND - 4] })));
  }
  return { nm: 'Floor', shapes: items.reverse(), ks: transformKS({ p: { a: 0, k: [ox, 0] } }) };
}

/** Static props layer, or null when there are none. */
export function propsLayer(nm: string, shapes: PropShape[] | undefined, ox: number): LayerDraft | null {
  if (!shapes?.length) return null;
  return { nm, shapes: shapes.map(propGroup).reverse(), ks: transformKS({ p: { a: 0, k: [ox, 0] } }) };
}

/** Moving equipment: rigid parts follow at(J, t) -> { p, a }, cables follow at(J, t) -> [p0, p1]. */
export function dynamicLayer<J>(d: MovingPart<J>, frames: { t: number; J: J }[], pal: Palette, ox: number): LayerDraft {
  const shift = (p: Vec2): Vec2 => [p[0] + ox, p[1]];
  if (d.kind === 'line') {
    const paths = frames.map(({ J, t }): BezierPath => {
      const [a, b] = d.at(J, t).map(shift);
      return { c: false, v: [a!, b!], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] };
    });
    return { nm: d.nm, shapes: [group(d.nm, [{ ty: 'sh', nm: 'Path', ks: animProp(paths, 'path', TOL.path) }, stroke(d.color(pal), d.width ?? 3)])], ks: transformKS({}) };
  }
  if (d.kind === 'curve') {
    const paths = frames.map(({ J, t }) => smoothOpen(d.at(J, t).map(shift)));
    const n = paths[0]!.v.length;
    if (paths.some((x) => x.v.length !== n)) throw new Error(`${d.nm}: curve point count changes between frames`);
    return { nm: d.nm, shapes: [group(d.nm, [{ ty: 'sh', nm: 'Path', ks: animProp(paths, 'path', TOL.path) }, stroke(d.color(pal), d.width ?? 4)])], ks: transformKS({}) };
  }
  const p = animProp(frames.map(({ J, t }) => shift(d.at(J, t).p)), 'pos', TOL.pos);
  const r = animProp(unwrap(frames.map(({ J, t }) => d.at(J, t).a ?? 0)), 'scalar', TOL.rot);
  return { nm: d.nm, shapes: d.shapes(pal).map(propGroup).reverse(), ks: transformKS({ p, r }) };
}

/** Final Lottie object. `layers` run back to front; Lottie draws the first layer on top. */
export function finish(ex: Exercise, palName: PaletteName, layers: LayerDraft[], N: number, warnings: string[], bb: Box, ox: number, zoom = 1): Composition {
  const out = [...layers].reverse().map((l, i) => shapeLayer(i + 1, l.nm, l.shapes, l.ks, N));
  if (zoom < 1) {
    // Null parent that scales every layer about the ground center.
    const ind = out.length + 1;
    const c: Vec2 = [W / 2, GROUND];
    const ks = { ...transformKS({ p: { a: 0, k: c }, s: { a: 0, k: [zoom * 100, zoom * 100] } }), a: { a: 0, k: c } };
    for (const l of out) l.parent = ind;
    out.push({ ddd: 0, ind, ty: 3, nm: 'Fit', sr: 1, ks, ao: 0, ip: 0, op: N, st: 0, bm: 0 });
  }
  const anim = {
    v: '5.7.4', fr: FPS, ip: 0, op: N, w: W, h: H, nm: ex.id, ddd: 0, assets: [], layers: out, markers: [],
    meta: { g: 'Boji exercise-animation generator', a: 'Boji', d: `${ex.name} (${palName})` },
  };
  const box = bb.map((x, i) => (i === 1 || i === 3 ? x : x + ox)).map((x, i) => (i === 0 || i === 2 ? W / 2 + (x - W / 2) * zoom : GROUND + (x - GROUND) * zoom));
  return { anim, warnings, frames: N, bbox: box.map(Math.round), zoom };
}
