// Compose one exercise and palette into a Lottie animation.
// Layers: floor, back props, moving equipment, body parts back to front, front props.
import { IK_WARNINGS, add, dir, mul, type Vec2 } from './math.ts';
import { animProp, ellipse, fill, group, rect, shapeLayer, smoothClosed, stroke, tr, transformKS, unwrap, type BezierPath, type LottieObject } from './lottie.ts';
import { GROUND, MUSCLES, highlightGroup, partShapes, solve, torsoShapes, type Joints, type Limb, type Part, type Side, type TorsoFrame } from './rig.ts';
import { PALETTES, type PaletteName } from './palettes.ts';
import type { Exercise, MovingPart, MuscleSpec, PropShape, Props } from './exercise.ts';

const W = 512, H = 512;
export const FPS = 60;
const TOL = { pos: 0.2, rot: 0.2, opacity: 0.6, path: 0.25 };

type LimbKey = `${Limb}_${Side}`;
type MuscleFrame = Exclude<TorsoFrame, 'pelvis'>;
type LayerKey = LimbKey | 'neck' | 'pelvis' | 'torso' | MuscleFrame | 'head';
type FrameKey = Exclude<LayerKey, 'torso'>;

const LIMBS: Record<LimbKey, Limb> = {
  thigh_n: 'thigh', shin_n: 'shin', foot_n: 'foot', upper_n: 'upper', fore_n: 'fore', hand_n: 'hand',
  thigh_f: 'thigh', shin_f: 'shin', foot_f: 'foot', upper_f: 'upper', fore_f: 'fore', hand_f: 'hand',
};
const isLimb = (part: string): part is Limb => `${part}_n` in LIMBS;
// Back to front.
const Z: LayerKey[] = ['upper_f', 'fore_f', 'hand_f', 'thigh_f', 'shin_f', 'foot_f', 'neck', 'pelvis', 'torso', 'tPec', 'tAbs', 'tLats', 'tLow', 'head', 'thigh_n', 'shin_n', 'foot_n', 'upper_n', 'fore_n', 'hand_n'];
const MUSCLE_FRAMES: readonly LayerKey[] = ['tPec', 'tAbs', 'tLats', 'tLow'];
const isMuscleFrame = (key: LayerKey): key is MuscleFrame => MUSCLE_FRAMES.includes(key);
const LAYER_NAMES: Record<LayerKey, string> = {
  upper_f: 'Far Upper Arm', fore_f: 'Far Forearm', hand_f: 'Far Hand', thigh_f: 'Far Thigh', shin_f: 'Far Shin', foot_f: 'Far Foot',
  neck: 'Neck', pelvis: 'Pelvis', torso: 'Torso', tPec: 'Chest Muscles', tAbs: 'Core Muscles', tLats: 'Back Muscles', tLow: 'Lower Back Muscles', head: 'Head',
  thigh_n: 'Near Thigh', shin_n: 'Near Shin', foot_n: 'Near Foot', upper_n: 'Near Upper Arm', fore_n: 'Near Forearm', hand_n: 'Near Hand',
};

type Box = [number, number, number, number];

interface LayerDraft {
  nm: string;
  shapes: LottieObject[];
  ks: LottieObject;
}

export interface Composition {
  anim: LottieObject;
  warnings: string[];
  frames: number;
  /** Bounds of figure and props on the canvas: x0, y0, x1, y1. */
  bbox: number[];
}

function bbox(J: Joints): Box {
  const pts: Vec2[] = [J.H, J.M, J.N, J.S, J.Sf];
  for (const s of ['n', 'f'] as const) {
    pts.push(J[`knee_${s}`], J[`ankle_${s}`], J[`elbow_${s}`], J[`wrist_${s}`]);
    pts.push(add(J[`ankle_${s}`], mul(dir(J[`foot_${s}`].a), 46)));
    pts.push(add(J[`wrist_${s}`], mul(dir(J[`hand_${s}`].a), 16)));
  }
  let [x0, y0, x1, y1]: Box = [Infinity, Infinity, -Infinity, -Infinity];
  const m = 18;
  for (const p of pts) { x0 = Math.min(x0, p[0] - m); x1 = Math.max(x1, p[0] + m); y0 = Math.min(y0, p[1] - m); y1 = Math.max(y1, p[1] + m); }
  const hc = J.headCenter;
  x0 = Math.min(x0, hc[0] - 27); x1 = Math.max(x1, hc[0] + 27); y0 = Math.min(y0, hc[1] - 27); y1 = Math.max(y1, hc[1] + 27);
  return [x0, y0, x1, y1];
}

function propGroup(p: PropShape): LottieObject {
  if (p.kind === 'box') return group(p.nm, [rect([0, 0], p.s, p.r ?? 0), fill(p.color)], tr({ p: p.c, r: p.rot ?? 0 }));
  return group(p.nm, [ellipse([0, 0], p.s), fill(p.color)], tr({ p: p.c, r: p.rot ?? 0 }));
}

export function compose(ex: Exercise, palName: PaletteName): Composition {
  const pal = PALETTES[palName];
  const N = Math.round(ex.tl.total * FPS);
  IK_WARNINGS.length = 0;
  const frames: { t: number; J: Joints }[] = [];
  for (let f = 0; f <= N; f++) {
    const t = (f % N) / N;
    frames.push({ t, J: solve(ex.pose(t)) });
  }
  const warnings = [...new Set(IK_WARNINGS)];

  // Framing: center horizontally, keep the floor fixed.
  let bb: Box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const { J } of frames) {
    const b = bbox(J);
    bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])];
  }
  const figure: Box = [...bb];
  if (ex.propsBox) { bb[0] = Math.min(bb[0], ex.propsBox[0]); bb[2] = Math.max(bb[2], ex.propsBox[1]); }
  const ox = Math.round(W / 2 - (bb[0] + bb[2]) / 2);
  if (bb[1] < 6) warnings.push(`top edge ${bb[1].toFixed(0)} is above the canvas`);
  if (bb[2] - bb[0] > W - 8) warnings.push(`width ${(bb[2] - bb[0]).toFixed(0)} exceeds the canvas`);

  const shift = (p: Vec2): Vec2 => [p[0] + ox, p[1]];
  const phaseEffort = (t: number): number => {
    if (!ex.tl.at) throw new Error(`${ex.id}: muscles without e() need a timeline with at()`);
    return ex.tl.at(t).e;
  };
  const effort = (m: MuscleSpec, t: number): number => {
    const e = m.e ? m.e(t) : phaseEffort(t);
    return Math.max(0, Math.min(1, e * (m.scale ?? 1)));
  };
  const opacityProp = (m: MuscleSpec) => animProp(frames.map(({ t }) => 14 + 66 * effort(m, t)), 'scalar', TOL.opacity);

  // Muscle highlights grouped by layer key.
  const highlights: Partial<Record<LayerKey, LottieObject[]>> = {};
  for (const m of ex.muscles ?? []) {
    const part = MUSCLES[m.m].part;
    const keys: LayerKey[] = isLimb(part)
      ? (m.side === 'far' ? [`${part}_f`] : m.side === 'near' ? [`${part}_n`] : [`${part}_n`, `${part}_f`])
      : [part];
    for (const k of keys) (highlights[k] ??= []).push(highlightGroup(m.m, pal, opacityProp(m)));
  }

  const layers: LayerDraft[] = [];
  const rigid = (key: FrameKey, nm: string, shapes: LottieObject[]): void => {
    const p = animProp(frames.map(({ J }) => shift(J[key].p)), 'pos', TOL.pos);
    const r = animProp(unwrap(frames.map(({ J }) => J[key].a - 90)), 'scalar', TOL.rot);
    layers.push({ nm, shapes, ks: transformKS({ p, r }) });
  };

  // Floor shadow and mat.
  const floorItems: LottieObject[] = [];
  const sx0 = (ex.propsBox ? Math.min(figure[0], ex.propsBox[0]) : figure[0]) + 14;
  const sx1 = (ex.propsBox ? Math.max(figure[2], ex.propsBox[1]) : figure[2]) - 14;
  floorItems.push(group('shadow', [ellipse([0, 0], [sx1 - sx0 + 30, 14]), { ...fill(pal.shadow), o: { a: 0, k: pal.shadowOpacity } }], tr({ p: [(sx0 + sx1) / 2, GROUND + 2] })));
  if (ex.mat) {
    const mx0 = figure[0] - 6, mx1 = figure[2] + 6;
    floorItems.push(group('mat-edge', [rect([0, 0], [mx1 - mx0, 8], 4), fill(pal.matEdge)], tr({ p: [(mx0 + mx1) / 2, GROUND - 3] })));
    floorItems.push(group('mat', [rect([0, 0], [mx1 - mx0, 6], 3), fill(pal.mat)], tr({ p: [(mx0 + mx1) / 2, GROUND - 4] })));
  }
  layers.push({ nm: 'Floor', shapes: floorItems.reverse(), ks: transformKS({ p: { a: 0, k: [ox, 0] } }) });

  const props: Props = ex.props ? ex.props(pal) : {};
  if (props.back?.length) layers.push({ nm: 'Props Back', shapes: props.back.map(propGroup).reverse(), ks: transformKS({ p: { a: 0, k: [ox, 0] } }) });

  // Moving equipment: rigid parts follow at(J, t) -> { p, a }, cables follow at(J, t) -> [p0, p1].
  const dynamicLayer = (d: MovingPart): LayerDraft => {
    if (d.kind === 'line') {
      const paths = frames.map(({ J, t }): BezierPath => {
        const [a, b] = d.at(J, t).map(shift);
        return { c: false, v: [a!, b!], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] };
      });
      return { nm: d.nm, shapes: [group(d.nm, [{ ty: 'sh', nm: 'Path', ks: animProp(paths, 'path', TOL.path) }, stroke(d.color(pal), d.width ?? 3)])], ks: transformKS({}) };
    }
    const p = animProp(frames.map(({ J, t }) => shift(d.at(J, t).p)), 'pos', TOL.pos);
    const r = animProp(unwrap(frames.map(({ J, t }) => d.at(J, t).a ?? 0)), 'scalar', TOL.rot);
    return { nm: d.nm, shapes: d.shapes(pal).map(propGroup).reverse(), ks: transformKS({ p, r }) };
  };
  for (const d of (ex.dynamic ?? []).filter((x) => x.z === 'back')) layers.push(dynamicLayer(d));

  for (const key of Z) {
    const hl = highlights[key] ?? [];
    if (key === 'torso') {
      const paths = frames.map(({ J }) => smoothClosed(J.torsoPts.map(shift), [0, J.torsoPts.length - 1]));
      layers.push({ nm: LAYER_NAMES.torso, shapes: torsoShapes(animProp(paths, 'path', TOL.path), pal), ks: transformKS({}) });
      continue;
    }
    if (isMuscleFrame(key)) { if (hl.length) rigid(key, LAYER_NAMES[key], hl.reverse()); continue; }
    const part: Part = key === 'neck' || key === 'pelvis' || key === 'head' ? key : LIMBS[key];
    const far = key.endsWith('_f');
    const shapes = [...partShapes(part, pal, far), ...hl];
    rigid(key, LAYER_NAMES[key], shapes.reverse());
  }
  for (const d of (ex.dynamic ?? []).filter((x) => x.z === 'front')) layers.push(dynamicLayer(d));
  if (props.front?.length) layers.push({ nm: 'Props Front', shapes: props.front.map(propGroup).reverse(), ks: transformKS({ p: { a: 0, k: [ox, 0] } }) });

  // Lottie draws the first layer on top.
  const out = layers.reverse().map((l, i) => shapeLayer(i + 1, l.nm, l.shapes, l.ks, N));
  const anim = {
    v: '5.7.4', fr: FPS, ip: 0, op: N, w: W, h: H, nm: ex.id, ddd: 0, assets: [], layers: out, markers: [],
    meta: { g: 'Boji exercise-animation generator', a: 'Boji', d: `${ex.name} (${palName})` },
  };
  return { anim, warnings, frames: N, bbox: bb.map((x) => Math.round(x + (x === bb[1] || x === bb[3] ? 0 : ox))) };
}
