// Compose a front-view exercise (front-rig.ts) into a Lottie animation.
// Layers: floor, back props, moving equipment, body parts in draw order (FRONT_ORDER or ex.order), front props.
import { IK_WARNINGS, ang, clamp, dir, dot, len, smooth, sub, type Vec2 } from './math.ts';
import { animProp, ellipse, fill, group, smoothClosed, tr, trAnim, transformKS, unwrap, type LottieObject } from './lottie.ts';
import { torsoShapes } from './rig.ts';
import {
  FRONT_MUSCLES, FRONT_ORDER, PELVIS_DEPTH, SEG_LEN, TORSO_DEPTH, TORSO_FRAME_S, faceShapes, frontCollarShapes, hairShapes,
  headBackShapes, headTurnedAwayShapes, pelvisShapes, project, projDir, rigidFrame, segShapes, solveFront,
  type FLimb, type FSegKey, type FSegPart, type FTorsoFrame, type FrontJoints, type FrontLayerKey, type FrontRegion, type ScreenFrame,
} from './front-rig.ts';
import { PALETTES, type PaletteName } from './palettes.ts';
import type { FrontExercise } from './exercise.ts';
import { EMPTY_BOX, FPS, TOL, dynamicLayer, effortOpacity, finish, floorLayer, frameOffset, propsLayer, union, type Box, type Composition, type LayerDraft } from './compose-shared.ts';

const LIMBS: FLimb[] = ['thigh', 'shin', 'foot', 'upper', 'fore', 'hand'];
const isSeg = (k: FrontLayerKey): k is FSegKey => k === 'neck' || LIMBS.some((l) => k === `${l}_l` || k === `${l}_r`);
const segPart = (k: FSegKey): FSegPart => (k === 'neck' ? 'neck' : (k.slice(0, -2) as FLimb));
const isLimbPart = (p: FrontRegion['part']): p is FLimb => (LIMBS as string[]).includes(p);
const TORSO_FRAMES: readonly FrontLayerKey[] = ['chest', 'abs', 'lats', 'traps'];
const isTorsoFrame = (k: FrontLayerKey): k is FTorsoFrame => TORSO_FRAMES.includes(k);

const SIDE_NAME = { l: 'Left', r: 'Right' } as const;
const PART_NAME: Record<FLimb, string> = { thigh: 'Thigh', shin: 'Shin', foot: 'Foot', upper: 'Upper Arm', fore: 'Forearm', hand: 'Hand' };
function layerName(k: FrontLayerKey): string {
  if (k === 'neck' || !isSeg(k)) {
    const names: Record<string, string> = {
      neck: 'Neck', pelvis: 'Pelvis', torso: 'Torso', chest: 'Chest Muscles', abs: 'Core Muscles', lats: 'Back Muscles',
      traps: 'Trapezius', collar: 'Collar', head: 'Head',
    };
    return names[k]!;
  }
  return `${SIDE_NAME[k.slice(-1) as 'l' | 'r']} ${PART_NAME[segPart(k) as FLimb]}`;
}

function frontBox(J: FrontJoints): Box {
  const pts: Vec2[] = [J.pelvis, J.M, J.N, J.E].map(project);
  for (const s of ['l', 'r'] as const) {
    for (const j of ['hip', 'knee', 'ankle', 'toe', 'shoulder', 'elbow', 'wrist', 'tip'] as const) pts.push(project(J[`${j}_${s}`]));
  }
  let b: Box = EMPTY_BOX;
  const m = 18;
  for (const p of pts) b = union(b, [p[0] - m, p[1] - m, p[0] + m, p[1] + m]);
  for (const p of J.torsoPts) b = union(b, [p[0] - 2, p[1] - 2, p[0] + 2, p[1] + 2]);
  const hc = project(J.headCenter);
  return union(b, [hc[0] - 27, hc[1] - 31, hc[0] + 27, hc[1] + 27]);
}

/** Replace NaN entries with the nearest earlier valid value, or the first valid value. All NaN gives 0. */
function fillGaps(list: number[]): number[] {
  const first = list.find((x) => !Number.isNaN(x)) ?? 0;
  let last = first;
  return list.map((x) => (Number.isNaN(x) ? last : (last = x)));
}

export function composeFront(ex: FrontExercise, palName: PaletteName): Composition {
  const pal = PALETTES[palName];
  const N = Math.round(ex.tl.total * FPS);
  IK_WARNINGS.length = 0;
  const frames: { t: number; J: FrontJoints }[] = [];
  for (let f = 0; f <= N; f++) {
    const t = (f % N) / N;
    frames.push({ t, J: solveFront(ex.pose(t)) });
  }
  const warnings = [...new Set(IK_WARNINGS)];

  let figure: Box = EMPTY_BOX;
  for (const { J } of frames) figure = union(figure, frontBox(J));
  const { ox, bb, zoom } = frameOffset(ex, figure, warnings);
  const shift = (p: Vec2): Vec2 => [p[0] + ox, p[1]];
  const ts = frames.map(({ t }) => t);

  const order = ex.order ?? FRONT_ORDER;
  if (order.length !== FRONT_ORDER.length || new Set(order).size !== order.length || order.some((k) => !FRONT_ORDER.includes(k))) {
    throw new Error(`${ex.id}: order must list every front layer key once`);
  }

  // Segment geometry per frame: root position, projected length and rotation.
  const segCache = new Map<FSegKey, { p: Vec2; l: number; r: number }[]>();
  const segData = (key: FSegKey) => {
    let d = segCache.get(key);
    if (!d) {
      const L = SEG_LEN[segPart(key)];
      const raw = frames.map(({ J }) => {
        const sg = J.seg[key];
        const a = project(sg.a), v = sub(project(sg.b), a), l = len(v);
        const rBone = l > 0.5 ? ang(v) - 90 : NaN;
        const xs = sg.x ? projDir(sg.x) : null;
        if (!xs || len(xs) < 0.3) return { p: a, l, r: rBone };
        // Foreshortened bone: its projected direction is unstable, so rotate by the lateral axis instead.
        const rSide = ang(xs), w = smooth((l / L - 0.35) / 0.4);
        if (Number.isNaN(rBone)) return { p: a, l, r: rSide };
        const diff = ((((rBone - rSide) % 360) + 540) % 360) - 180;
        return { p: a, l, r: rSide + diff * w };
      });
      const rs = fillGaps(raw.map((x) => x.r));
      d = raw.map((x, i) => ({ ...x, r: rs[i]! }));
      segCache.set(key, d);
    }
    return d;
  };
  /** +1 when local +x of the segment points toward the body midline in the first frame, else -1. */
  const innerSign = (key: FSegKey): number => {
    const J = frames[0]!.J;
    const toMid = sub(project(J.pelvis), project(J.seg[key].a));
    return dot(dir(segData(key)[0]!.r), toMid) >= 0 ? 1 : -1;
  };

  // Muscle highlights grouped by layer key.
  const highlights: Partial<Record<FrontLayerKey, LottieObject[]>> = {};
  for (const m of ex.muscles ?? []) {
    if (m.region && !('view' in m.region)) throw new Error(`${ex.id}: muscle ${m.m} has a side-view region`);
    const region = (m.region as FrontRegion | undefined) ?? FRONT_MUSCLES[m.m];
    if (!region) { warnings.push(`muscle ${m.m} faces away from the viewer; give it a region`); continue; }
    const side = m.side ?? 'both';
    if (side === 'near' || side === 'far') throw new Error(`${ex.id}: muscle ${m.m}: side '${side}' is for side view`);
    const op = effortOpacity(ex, m, ts);
    const ell = (c: Vec2, r: number) => group(`highlight-${m.m}`, [ellipse([0, 0], region.s), fill(pal.accent, 'accent')], tr({ p: c, r, o: op }));
    const part = region.part;
    if (isLimbPart(part)) {
      const keys: FSegKey[] = side === 'l' ? [`${part}_l`] : side === 'r' ? [`${part}_r`] : [`${part}_l`, `${part}_r`];
      for (const k of keys) {
        const x = region.inner ? Math.abs(region.c[0]) * innerSign(k) : region.c[0];
        (highlights[k] ??= []).push(ell([x, region.c[1]], region.r ?? 0));
      }
    } else {
      const list = (highlights[part] ??= []);
      list.push(ell(region.c, region.r ?? 0));
      if (region.mirror) list.push(ell([-region.c[0], region.c[1]], -(region.r ?? 0)));
    }
  }

  const layers: LayerDraft[] = [];
  /** `shapes` run back to front. */
  const rigidLayer = (key: FrontLayerKey, fr: ScreenFrame[], shapes: LottieObject[]): void => {
    const p = animProp(fr.map((f) => shift(f.p)), 'pos', TOL.pos);
    const r = animProp(unwrap(fr.map((f) => f.r)), 'scalar', TOL.rot);
    const s = animProp(fr.map((f): Vec2 => [100 * f.s[0], 100 * f.s[1]]), 'vec', TOL.scale);
    layers.push({ nm: layerName(key), shapes: [...shapes].reverse(), ks: transformKS({ p, r, s }) });
  };
  const segLayer = (key: FSegKey, hl: LottieObject[]): void => {
    const part = segPart(key);
    const L = SEG_LEN[part];
    const d = segData(key);
    const k = d.map((x) => Math.max(x.l / L, 0.05));
    const p = animProp(d.map((x) => shift(x.p)), 'pos', TOL.pos);
    const r = animProp(unwrap(d.map((x) => x.r)), 'scalar', TOL.rot);
    const s = animProp(k.map((x): Vec2 => [100, 100 * x]), 'vec', TOL.scale);
    const capS = animProp(k.map((x): Vec2 => [100, 100 / x]), 'vec', TOL.scale);
    const sh = segShapes(part, pal, false);
    const root = group('cap-root', [...sh.root].reverse(), trAnim({ s: capS }));
    const end = group('cap-end', [...sh.end].reverse(), trAnim({ p: { a: 0, k: [0, L] }, s: capS }));
    layers.push({ nm: layerName(key), shapes: [...sh.body, root, end, ...hl].reverse(), ks: transformKS({ p, r, s }) });
  };
  const headLayer = (hl: LottieObject[]): void => {
    const fr = frames.map(({ J }) => rigidFrame(J.E, J.headB, 1, false));
    // Face features follow the projected forward axis of the head and fade out when the face turns away.
    const offsets = frames.map(({ J }, i): Vec2 => {
      const f2 = projDir(J.headB.F), r = fr[i]!.r;
      return [dot(f2, dir(r)) * 11, dot(f2, dir(r + 90)) * 8];
    });
    const faceO = frames.map(({ J }) => 100 * clamp((J.headB.F[2] - 0.05) / 0.2, 0, 1));
    const face = group('face', [...faceShapes(pal)].reverse(), trAnim({ p: animProp(offsets, 'pos', TOL.pos), o: animProp(faceO, 'scalar', TOL.opacity) }));
    const away = group('back-of-head', [...headTurnedAwayShapes(pal)].reverse(), trAnim({ o: animProp(faceO.map((x) => 100 - x), 'scalar', TOL.opacity) }));
    rigidLayer('head', fr, [...headBackShapes(pal), face, ...hairShapes(pal), away, ...hl]);
  };

  layers.push(floorLayer(ex, pal, figure, ox));
  const props = ex.props ? ex.props(pal) : {};
  const back = propsLayer('Props Back', props.back, ox);
  if (back) layers.push(back);
  const dyn = (z: string): void => { for (const d of (ex.dynamic ?? []).filter((x) => x.z === z)) layers.push(dynamicLayer(d, frames, pal, ox)); };
  dyn('back');

  let armsSeen = false;
  for (const key of order) {
    // Held equipment goes in front of the torso and head, behind the arms.
    if (!armsSeen && /^(upper|fore|hand)_/.test(key)) { dyn('underNearArm'); dyn('overFarArm'); armsSeen = true; }
    const hl = highlights[key] ?? [];
    if (key === 'torso') {
      const paths = frames.map(({ J }) => smoothClosed(J.torsoPts.map(shift), [0, J.torsoPts.length - 1]));
      layers.push({ nm: layerName('torso'), shapes: torsoShapes(animProp(paths, 'path', TOL.path), pal), ks: transformKS({}) });
    } else if (isTorsoFrame(key)) {
      if (!hl.length) continue;
      const s = TORSO_FRAME_S[key];
      rigidLayer(key, frames.map(({ J }) => rigidFrame(J.B(s), { ...J.basisAt(s), U: J.T(s) }, TORSO_DEPTH)), hl);
    } else if (key === 'pelvis') {
      rigidLayer('pelvis', frames.map(({ J }) => rigidFrame(J.pelvis, J.hips, PELVIS_DEPTH)), [...pelvisShapes(pal), ...hl]);
    } else if (key === 'collar') {
      rigidLayer('collar', frames.map(({ J }) => rigidFrame(J.N, J.chest, TORSO_DEPTH)), [...frontCollarShapes(pal), ...hl]);
    } else if (key === 'head') {
      headLayer(hl);
    } else {
      segLayer(key, hl);
    }
  }
  if (!armsSeen) { dyn('underNearArm'); dyn('overFarArm'); }
  dyn('front');
  const front = propsLayer('Props Front', props.front, ox);
  if (front) layers.push(front);
  return finish(ex, palName, layers, N, warnings, bb, ox, zoom);
}
