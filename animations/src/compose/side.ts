// Side-view composer: one side-view exercise and palette into a Lottie animation. index.ts picks this file or
// front.ts. Layers: floor, back props, moving equipment, body parts back to front, front props.
import { IK_WARNINGS } from '@/rig/ik.ts';
import { add, dir, mul, type Vec2 } from '@/math/vec2.ts';
import { animProp, smoothClosed, transformKS, unwrap, type LottieObject } from '@/draw/lottie.ts';
import { MUSCLES, collarShapes, highlightGroup, partShapes, solve, torsoShapes, type Joints, type Limb, type MuscleRegion, type Part, type Side, type TorsoFrame } from '@/rig/side.ts';
import { PALETTES, type PaletteName } from '@/draw/palettes.ts';
import type { SideExercise } from '@/exercise.ts';
import { EMPTY_BOX, FPS, TOL, dynamicLayer, effortOpacity, finish, floorLayer, frameOffset, propsLayer, union, type Box, type Composition, type LayerDraft } from './shared.ts';

type LimbKey = `${Limb}_${Side}`;
type MuscleFrame = Exclude<TorsoFrame, 'pelvis'>;
type LayerKey = LimbKey | 'neck' | 'pelvis' | 'torso' | MuscleFrame | 'collar' | 'head';
type FrameKey = Exclude<LayerKey, 'torso'>;

const LIMBS: Record<LimbKey, Limb> = {
  thigh_n: 'thigh', shin_n: 'shin', foot_n: 'foot', upper_n: 'upper', fore_n: 'fore', hand_n: 'hand',
  thigh_f: 'thigh', shin_f: 'shin', foot_f: 'foot', upper_f: 'upper', fore_f: 'fore', hand_f: 'hand',
};
const isLimb = (part: string): part is Limb => `${part}_n` in LIMBS;
// Back to front.
const Z: LayerKey[] = ['upper_f', 'fore_f', 'hand_f', 'thigh_f', 'shin_f', 'foot_f', 'neck', 'pelvis', 'torso', 'tPec', 'tAbs', 'tLats', 'tLow', 'collar', 'head', 'thigh_n', 'shin_n', 'foot_n', 'upper_n', 'fore_n', 'hand_n'];
const MUSCLE_FRAMES: readonly LayerKey[] = ['tPec', 'tAbs', 'tLats', 'tLow'];
const isMuscleFrame = (key: LayerKey): key is MuscleFrame => MUSCLE_FRAMES.includes(key);
const LAYER_NAMES: Record<LayerKey, string> = {
  upper_f: 'Far Upper Arm', fore_f: 'Far Forearm', hand_f: 'Far Hand', thigh_f: 'Far Thigh', shin_f: 'Far Shin', foot_f: 'Far Foot',
  neck: 'Neck', pelvis: 'Pelvis', torso: 'Torso', tPec: 'Chest Muscles', tAbs: 'Core Muscles', tLats: 'Back Muscles', tLow: 'Lower Back Muscles', collar: 'Collar', head: 'Head',
  thigh_n: 'Near Thigh', shin_n: 'Near Shin', foot_n: 'Near Foot', upper_n: 'Near Upper Arm', fore_n: 'Near Forearm', hand_n: 'Near Hand',
};

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

export function composeSide(ex: SideExercise, palName: PaletteName): Composition {
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
  let figure: Box = EMPTY_BOX;
  for (const { J } of frames) figure = union(figure, bbox(J));
  const { ox, bb, zoom } = frameOffset(ex, figure, warnings);

  const shift = (p: Vec2): Vec2 => [p[0] + ox, p[1]];
  const ts = frames.map(({ t }) => t);

  // Muscle highlights grouped by layer key.
  const highlights: Partial<Record<LayerKey, LottieObject[]>> = {};
  for (const m of ex.muscles ?? []) {
    if (m.region && 'view' in m.region) throw new Error(`${ex.id}: muscle ${m.m} has a front-view region`);
    const custom = m.region as MuscleRegion | undefined;
    const region = custom ?? MUSCLES[m.m];
    const part = region.part;
    const side = m.side ?? region.defaultSide ?? 'both';
    if (side === 'l' || side === 'r') throw new Error(`${ex.id}: muscle ${m.m}: side '${side}' is for front view`);
    const keys: LayerKey[] = isLimb(part)
      ? (side === 'far' ? [`${part}_f`] : side === 'near' ? [`${part}_n`] : [`${part}_n`, `${part}_f`])
      : [part];
    for (const k of keys) (highlights[k] ??= []).push(highlightGroup(m.m, pal, effortOpacity(ex, m, ts), custom));
  }

  const layers: LayerDraft[] = [];
  const rigid = (key: FrameKey, nm: string, shapes: LottieObject[]): void => {
    const p = animProp(frames.map(({ J }) => shift(J[key].p)), 'pos', TOL.pos);
    const r = animProp(unwrap(frames.map(({ J }) => J[key].a - 90)), 'scalar', TOL.rot);
    layers.push({ nm, shapes, ks: transformKS({ p, r }) });
  };

  layers.push(floorLayer(ex, pal, figure, ox));
  const props = ex.props ? ex.props(pal) : {};
  const back = propsLayer('Props Back', props.back, ox);
  if (back) layers.push(back);

  const dyn = (z: string): void => { for (const d of (ex.dynamic ?? []).filter((x) => x.z === z)) layers.push(dynamicLayer(d, frames, pal, ox)); };
  dyn('back');
  for (const key of Z) {
    // Held equipment between body layers: under the near arm, or over the far arm.
    if (key === 'upper_n') dyn('underNearArm');
    const hl = highlights[key] ?? [];
    if (key === 'torso') {
      const paths = frames.map(({ J }) => smoothClosed(J.torsoPts.map(shift), [0, J.torsoPts.length - 1]));
      layers.push({ nm: LAYER_NAMES.torso, shapes: torsoShapes(animProp(paths, 'path', TOL.path), pal), ks: transformKS({}) });
      continue;
    }
    if (isMuscleFrame(key)) { if (hl.length) rigid(key, LAYER_NAMES[key], hl.reverse()); continue; }
    if (key === 'collar') { rigid('collar', LAYER_NAMES.collar, [...collarShapes(pal), ...hl].reverse()); continue; }
    const part: Part = key === 'neck' || key === 'pelvis' || key === 'head' ? key : LIMBS[key];
    const far = key.endsWith('_f');
    const shapes = [...partShapes(part, pal, far), ...hl];
    rigid(key, LAYER_NAMES[key], shapes.reverse());
    if (key === 'hand_f') dyn('overFarArm');
  }
  dyn('front');
  const front = propsLayer('Props Front', props.front, ox);
  if (front) layers.push(front);
  return finish(ex, palName, layers, N, warnings, bb, ox, zoom);
}
