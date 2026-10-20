// Side-view human rig. The figure faces +x when standing.
// Limb layers: local +y runs along the bone, local +x is anterior.
// Torso, neck and head layers: local +y runs up the body, local -x is anterior.
// The spine is a quadratic Bezier curve from bezier-js; vector math comes from math.ts (gl-matrix).
import { Bezier } from 'bezier-js';
import { add, addScaled, ang, bendFor, ik2, lerp, lerpV, mul, norm, polar, rotate, sub, type Vec2 } from './math.ts';
import { PathBuilder, blob, box, capsule, ellipse, fill, group, oval, pathShape, smoothClosed, stroke, tr, type BezierPath, type LottieObject, type Prop } from './lottie.ts';
import type { Palette } from './palettes.ts';

export const BODY = { thigh: 94, shin: 90, lumbar: 58, thoracic: 66, neck: 18, upper: 66, fore: 60, hand: 16, ankleH: 13 };
export const GROUND = 452;

export type Side = 'n' | 'f';
export type Limb = 'thigh' | 'shin' | 'foot' | 'upper' | 'fore' | 'hand';
export type TorsoFrame = 'pelvis' | 'tPec' | 'tAbs' | 'tLats' | 'tLow';
export type Part = Limb | 'neck' | 'head' | 'pelvis';
type LimbJoint = 'knee' | 'ankle' | 'elbow' | 'wrist';

/** Layer origin and bone direction in degrees. */
export interface Frame {
  p: Vec2;
  a: number;
}

/** Solved rig for one frame. Limb keys end in `_n` (near side) or `_f` (far side). */
export type Joints = {
  /** Hip joint, spine joint and neck base. */
  H: Vec2;
  M: Vec2;
  N: Vec2;
  /** Near shoulder, far shoulder and far hip. */
  S: Vec2;
  Sf: Vec2;
  Hf: Vec2;
  anterior: Vec2;
  /** Point, unit tangent and anterior normal of the spine curve at s in [0, 1]. */
  B: (s: number) => Vec2;
  T: (s: number) => Vec2;
  A: (s: number) => Vec2;
  torsoPts: Vec2[];
  /** Neck base with the torso direction at the top of the spine. The collar layer uses it. */
  collar: Frame;
  neck: Frame;
  head: Frame;
  headCenter: Vec2;
} & Record<TorsoFrame, Frame> & Record<`${Limb}_${Side}`, Frame> & Record<`${LimbJoint}_${Side}`, Vec2>;

/** A value fixed for the pose, or computed from joints solved earlier in the same frame. */
export type Dyn<T> = T | ((J: Joints) => T);

/** Give `target` (ankle or wrist) to solve the limb by IK, or `a1` and `a2` for fixed bone directions. */
export interface LimbSpec {
  target?: Dyn<Vec2>;
  /** Side the knee or elbow bends toward. */
  side?: Dyn<Vec2>;
  a1?: number;
  a2?: number;
  /** Foot direction (legs only). Default 0. */
  foot?: Dyn<number>;
  /** Hand direction (arms only). Default: forearm direction. */
  hand?: Dyn<number>;
}

export interface LimbPair {
  near: LimbSpec;
  far: LimbSpec;
}

/** Fixed lumbar and thoracic directions, or IK that puts the neck base at `target`. */
export type SpineSpec = { lumbar: number; thoracic: number } | { target: Vec2; side: Vec2 };

export interface Pose {
  hip: Vec2;
  spine: SpineSpec;
  neck: number;
  head: number;
  legs: LimbPair;
  arms: LimbPair;
  /** Moves both shoulders backward along the torso normal. Default 0. */
  shoulderShift?: number;
  /** Far hip offset behind the near hip. Default 3. */
  farHip?: number;
  /** Far shoulder offset behind the near shoulder. Default 4. */
  farShoulder?: number;
}

// Torso thickness along the spine curve: [s, offset]. s=0 hip joint, s=1 neck base.
const FRONT: Vec2[] = [[0.17, 16], [0.3, 16.5], [0.42, 17], [0.54, 18], [0.64, 19.5], [0.74, 21], [0.83, 20.5], [0.91, 17], [0.97, 12.5], [1.0, 9]];
const BACK: Vec2[] = [[0.17, 17], [0.3, 15.5], [0.42, 14.5], [0.54, 14.5], [0.64, 15.5], [0.74, 17], [0.83, 18], [0.91, 17.5], [0.97, 14], [1.0, 11]];

function val<T>(v: Dyn<T> | undefined, J: Joints): T | undefined {
  return typeof v === 'function' ? (v as (J: Joints) => T)(J) : v;
}

function solveLimb(root: Vec2, spec: LimbSpec, l1: number, l2: number, defaultSide: Vec2, tag: string, J: Joints) {
  let a1: number, a2: number;
  const target = val(spec.target, J);
  if (target) {
    const side = val(spec.side, J) ?? defaultSide;
    const r = ik2(root, target, l1, l2, bendFor(root, target, side), tag);
    a1 = r.a1; a2 = r.a2;
  } else {
    if (spec.a1 === undefined || spec.a2 === undefined) throw new Error(`${tag}: give target, or both a1 and a2`);
    a1 = spec.a1; a2 = spec.a2;
  }
  const mid = polar(root, a1, l1);
  const end = polar(mid, a2, l2);
  return { a1, a2, mid, end };
}

export function solve(pose: Pose): Joints {
  const H = pose.hip;
  let aL: number, aT: number;
  if ('target' in pose.spine) {
    const T = pose.spine.target;
    const r = ik2(H, T, BODY.lumbar, BODY.thoracic, bendFor(H, T, pose.spine.side), 'spine');
    aL = r.a1; aT = r.a2;
  } else {
    aL = pose.spine.lumbar; aT = pose.spine.thoracic;
  }
  const M = polar(H, aL, BODY.lumbar);
  const N = polar(M, aT, BODY.thoracic);
  // Quadratic Bezier from the hip joint to the neck base. The control point lies beyond the spine joint, away from
  // the chord H-N, so the curve stays smooth.
  const C = addScaled(M, sub(M, lerpV(H, N, 0.5)), 0.55);
  const spine = new Bezier(H[0], H[1], C[0], C[1], N[0], N[1]);
  const B = (s: number): Vec2 => { const p = spine.get(s); return [p.x, p.y]; };
  const T = (s: number): Vec2 => { const d = spine.derivative(s); return norm([d.x, d.y]); };
  // Anterior normal: the tangent turned 90° toward the front of the body.
  const A = (s: number): Vec2 => { const t = T(s); return [-t[1], t[0]]; };

  const front = FRONT.map(([s, f]) => addScaled(B(s), A(s), f));
  const back = BACK.map(([s, b]) => addScaled(B(s), A(s), -b)).reverse();
  const top = addScaled(N, T(1), 5);
  const torsoPts = [...front, top, ...back];

  const frame = (s: number): Frame => ({ p: B(s), a: ang(T(s)) });
  // Filled in below: shoulders and far hip, then legs, arms, neck and head.
  const J = {
    H, M, N, anterior: A(0), B, T, A,
    pelvis: { p: H, a: ang(T(0)) },
    tPec: frame(0.8), tAbs: frame(0.5), tLats: frame(0.68), tLow: frame(0.36),
    collar: frame(1),
    torsoPts,
  } as Joints;

  const shoulderShift = pose.shoulderShift ?? 0;
  const S = addScaled(addScaled(B(0.86), A(0.86), 2), A(0.86), -shoulderShift);
  const Sf = addScaled(S, A(0.86), -(pose.farShoulder ?? 4));
  const Hf = addScaled(H, A(0), -(pose.farHip ?? 3));
  J.S = S; J.Sf = Sf; J.Hf = Hf;

  // Legs first, so arm targets may depend on knees.
  for (const [side, root, sfx] of [['near', H, 'n'], ['far', Hf, 'f']] as const) {
    const spec = pose.legs[side];
    const r = solveLimb(root, spec, BODY.thigh, BODY.shin, A(0), `leg.${side}`, J);
    J[`thigh_${sfx}` as const] = { p: root, a: r.a1 };
    J[`shin_${sfx}` as const] = { p: r.mid, a: r.a2 };
    J[`foot_${sfx}` as const] = { p: r.end, a: val(spec.foot, J) ?? 0 };
    J[`knee_${sfx}` as const] = r.mid; J[`ankle_${sfx}` as const] = r.end;
  }
  for (const [side, root, sfx] of [['near', S, 'n'], ['far', Sf, 'f']] as const) {
    const spec = pose.arms[side];
    const r = solveLimb(root, spec, BODY.upper, BODY.fore, mul(A(0.86), -1), `arm.${side}`, J);
    J[`upper_${sfx}` as const] = { p: root, a: r.a1 };
    J[`fore_${sfx}` as const] = { p: r.mid, a: r.a2 };
    J[`hand_${sfx}` as const] = { p: r.end, a: val(spec.hand, J) ?? r.a2 };
    J[`elbow_${sfx}` as const] = r.mid; J[`wrist_${sfx}` as const] = r.end;
  }
  J.neck = { p: N, a: pose.neck };
  const E = polar(N, pose.neck, BODY.neck);
  J.head = { p: E, a: pose.head };
  J.headCenter = add(E, rotateLocal(HEAD_CENTER, pose.head));
  return J;
}

/** Convert a local point to a world offset for a layer whose bone direction is `a`. */
export const rotateLocal = (v: Vec2, a: number): Vec2 => rotate(v, a - 90);

// ---------- Part shapes (local coordinates) ----------
/** The head shapes sit this far below the head joint, so less neck shows. */
const HEAD_SHIFT = -2.5;
/** Skull center in head-layer coordinates. */
const HEAD_CENTER: Vec2 = [-1, 25.5 + HEAD_SHIFT];

const sleevePath = (L: number, r0: number, r1: number, hem: number): BezierPath => {
  const rs = r0 + 2.2, rh = lerp(r0, r1, hem / L) + 1.9;
  return new PathBuilder().move([rs, 0]).line([rh, hem + 1.5]).line([-rh, hem - 1.5]).line([-rs, 0]).arc([0, 0], rs, 180, 360).build();
};
/** Contrast band at the sleeve hem. */
const sleeveTrimPath = (L: number, r0: number, r1: number, hem: number): BezierPath => {
  const rh = lerp(r0, r1, hem / L) + 1.9, rt = lerp(r0, r1, (hem - 4) / L) + 2;
  return new PathBuilder().move([rh, hem + 1.5]).line([-rh, hem - 1.5]).line([-rt, hem - 5.2]).line([rt, hem - 2.2]).build();
};

// Foot outlines as (u along the foot toward the toes, w up). Local x = w, local y = u.
const swap = ([u, w]: Vec2): Vec2 => [w, u];
const shoePath = (): BezierPath => {
  const pts: Vec2[] = [[-12, -12.5], [8, -13], [30, -13], [41, -12], [46, -8.5], [44, -4], [36, -1], [24, 3], [12, 8.5], [4, 11], [-4, 11.5], [-12.5, 8], [-15.5, 0], [-15, -8]];
  return smoothClosed(pts.map(swap), [0, 2]);
};
const solePath = (): BezierPath => {
  const pts: Vec2[] = [[-14.5, -9], [-12, -13.5], [10, -14.2], [32, -14.2], [42, -13], [46.5, -9.5], [45.5, -7.5], [30, -10.2], [8, -10.4], [-12, -9.6]];
  return smoothClosed(pts.map(swap));
};
/** Side stripe on the shoe, from the heel toward the toes. */
const shoeStripePath = (): BezierPath => smoothClosed(([[-9, 0.5], [6, -3.5], [22, -7.5], [30, -8.6], [24, -5], [8, 2.5], [-6, 5]] as Vec2[]).map(swap));
const hairPath = (): BezierPath => smoothClosed([
  [-18, 49.5], [-21.5, 44], [-24.5, 38.5], [-19.5, 40.2], [-12, 41.8], [-3, 40], [4.5, 34], [8.5, 26], [11.5, 16], [16, 9.5], [21.5, 11.5], [25.5, 20], [26, 32], [22, 43.5], [13.5, 51.5], [1, 55], [-10, 54],
], [2]);
/** Smile below the nose, as an open stroke. Local +y is up, so the middle dips to a lower y. */
const smilePath = (): BezierPath => ({ c: false, v: [[-22.2, 15.6], [-15.8, 14.2]], i: [[0, 0], [-2.6, -1.4]], o: [[1.4, -2.8], [0, 0]] });
const shortsPath = (): BezierPath => smoothClosed([
  [-18.5, 27], [-19, 10], [-16.5, -6], [-7, -15.5], [8, -17], [21, -11], [28, 2], [26, 17], [19, 27.5],
], [0, 8]);
const shortsLegPath = (): BezierPath => {
  const L = BODY.thigh, r0 = 17, r1 = 12, hem = 50;
  const rs = r0 + 2.4, rh = lerp(r0, r1, hem / L) + 2;
  return new PathBuilder().move([rs, 0]).line([rh, hem + 2]).line([-rh, hem - 2]).line([-rs, 0]).arc([0, 0], rs, 180, 360).build();
};

export function partShapes(part: Part, pal: Palette, far: boolean): LottieObject[] {
  const skin = far ? pal.skinFar : pal.skin;
  const shirt = far ? pal.shirtFar : pal.shirt;
  const shorts = far ? pal.shortsFar : pal.shorts;
  const shoe = far ? pal.shoeFar : pal.shoe;
  const trim = far ? pal.shirtTrimFar : pal.shirtTrim;
  const sock = far ? pal.sockFar : pal.sock;
  switch (part) {
    case 'thigh': return [
      blob('skin', skin, capsule(BODY.thigh, 17, 12)),
      blob('shorts', shorts, shortsLegPath()),
      // The stripe runs down the outer side, so only the near leg shows it.
      ...(far ? [] : [box('stripe', pal.stripe, [0, 24.5], [3.4, 45], 1.7)]),
    ];
    case 'shin': return [
      blob('skin', skin, capsule(BODY.shin, 12, 8)),
      oval('calf', skin, [-5, 30], [17, 46]),
      box('sock', sock, [0, 78], [19, 18], 4),
      box('sock-band', far ? pal.shoeAccentFar : pal.shoeAccent, [0, 70.6], [19, 2.6], 1.3),
    ];
    case 'foot': return [
      blob('shoe', shoe, shoePath()),
      blob('shoe-stripe', far ? pal.shoeAccentFar : pal.shoeAccent, shoeStripePath()),
      blob('sole', pal.sole, solePath()),
    ];
    case 'upper': return [
      blob('skin', skin, capsule(BODY.upper, 11, 8.5)),
      blob('sleeve', shirt, sleevePath(BODY.upper, 11, 8.5, 26)),
      blob('sleeve-trim', trim, sleeveTrimPath(BODY.upper, 11, 8.5, 26)),
    ];
    case 'fore': return [
      blob('skin', skin, capsule(BODY.fore, 8.8, 6.4)),
      oval('forearm', skin, [2.5, 17], [16, 30]),
    ];
    case 'hand': return [
      blob('skin', skin, capsule(13, 6.6, 6.2, 0)),
      oval('thumb', skin, [4.5, 4], [6.5, 10], -12),
    ];
    case 'neck': return [blob('skin', skin, capsule(21, 8.8, 8.4, -6))];
    case 'head': return [group('head', [
      oval('skull', skin, [-1, 25.5], [47, 49]),
      oval('jaw', skin, [-9.5, 12], [27, 21]),
      oval('nose', skin, [-24.5, 22], [6.5, 7.5]),
      oval('ear', pal.skinShade, [5.5, 22.5], [9.5, 12.5]),
      group('blush', [ellipse([0, 0], [8.5, 5.2]), { ...fill(pal.blush), o: { a: 0, k: pal.blushOpacity } }], tr({ p: [-11.5, 18.5] })),
      blob('hair', pal.hair, hairPath()),
      oval('hair-shine', pal.hairShine, [-4, 50.5], [14, 3.6], -8),
      box('brow', pal.hair, [-15.8, 35.4], [8.6, 2.6], 1.3, -6),
      oval('eye', pal.eye, [-15.8, 27.6], [4.8, 6.2]),
      oval('eye-shine', pal.eyeShine, [-16.7, 29.2], [1.8, 1.8]),
      group('smile', [pathShape(smilePath()), stroke(pal.mouth, 1.7)]),
    ].reverse(), tr({ p: [0, HEAD_SHIFT] }))];
    case 'pelvis': return [
      blob('shorts', pal.shorts, shortsPath()),
      box('stripe', pal.stripe, [1.5, 6], [3.4, 40], 1.7),
    ];
  }
}

/** Crew-neck collar drawn over the top of the shirt. Local +y runs up the torso, -x is anterior. */
export function collarShapes(pal: Palette): LottieObject[] {
  return [box('collar', pal.shirtTrim, [0, 0.5], [18.5, 3.2], 1.6, 16)];
}

export type MuscleKey =
  | 'quads' | 'hamstrings' | 'hipFlexor' | 'calves' | 'glutes'
  | 'delts' | 'triceps' | 'biceps' | 'pecs' | 'abs' | 'lats' | 'upperBack' | 'lowerBack'
  | 'forearms' | 'traps' | 'neck' | 'abductors' | 'adductors' | 'obliques';

/** Highlight ellipse on a layer: local center, size and rotation. */
export interface MuscleRegion {
  part: Limb | TorsoFrame | 'collar' | 'neck';
  c: Vec2;
  s: Vec2;
  r?: number;
  /** Limb that shows the muscle when MuscleSpec.side is not given. Default: both. */
  defaultSide?: 'near' | 'far' | 'both';
}

export const MUSCLES: Record<MuscleKey, MuscleRegion> = {
  quads: { part: 'thigh', c: [5.5, 50], s: [17, 62] },
  hamstrings: { part: 'thigh', c: [-6, 52], s: [15, 58] },
  hipFlexor: { part: 'thigh', c: [9, 12], s: [13, 30], r: -8 },
  calves: { part: 'shin', c: [-6, 28], s: [15, 40] },
  glutes: { part: 'pelvis', c: [16.5, 1], s: [22, 28], r: 8 },
  delts: { part: 'upper', c: [0, 6], s: [21, 22] },
  triceps: { part: 'upper', c: [-5, 33], s: [11, 38] },
  biceps: { part: 'upper', c: [5, 33], s: [11, 34] },
  pecs: { part: 'tPec', c: [-15, 1], s: [13, 34] },
  abs: { part: 'tAbs', c: [-13, 0], s: [11, 46] },
  lats: { part: 'tLats', c: [11, -2], s: [12, 46] },
  upperBack: { part: 'tPec', c: [13, 2], s: [12, 32] },
  lowerBack: { part: 'tLow', c: [10, 0], s: [9, 34] },
  forearms: { part: 'fore', c: [2, 21], s: [14, 32] },
  traps: { part: 'collar', c: [9, -5], s: [11, 18], r: -12 },
  neck: { part: 'neck', c: [1, 6], s: [13, 15] },
  abductors: { part: 'pelvis', c: [4, 14], s: [22, 16], r: 6 },
  // The adductors lie on the inner thigh. In side view only the far leg shows its inner side.
  adductors: { part: 'thigh', c: [0, 30], s: [15, 46], defaultSide: 'far' },
  obliques: { part: 'tAbs', c: [-5, 2], s: [13, 40] },
};

export function highlightGroup(muscle: MuscleKey, pal: Palette, opacityProp: Prop, region?: MuscleRegion): LottieObject {
  const m = region ?? MUSCLES[muscle];
  return group(`highlight-${muscle}`, [ellipse([0, 0], m.s), fill(pal.accent, 'accent')], tr({ p: m.c, r: m.r ?? 0, o: opacityProp }));
}

export function torsoShapes(pathProp: Prop, pal: Palette): LottieObject[] {
  return [group('shirt', [{ ty: 'sh', nm: 'Path', ks: pathProp }, fill(pal.shirt)])];
}

/** Display names for muscle keys, used in index.json. */
export const MUSCLE_NAMES: Record<MuscleKey, string> = {
  quads: '股四头肌', glutes: '臀大肌', hamstrings: '腘绳肌', hipFlexor: '髂腰肌', calves: '小腿三头肌',
  delts: '三角肌', triceps: '肱三头肌', biceps: '肱二头肌', pecs: '胸大肌', abs: '腹直肌',
  lats: '背阔肌', upperBack: '菱形肌和斜方肌中部', lowerBack: '竖脊肌',
  forearms: '前臂肌群', traps: '斜方肌上部', neck: '颈部肌群', abductors: '臀中肌和髋外展肌',
  adductors: '髋内收肌', obliques: '腹斜肌',
};
