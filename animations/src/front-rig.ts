// Front-view human rig. The figure faces the viewer.
// World: X lateral (+X is the figure's left, screen right), Y up from the ground, Z toward the viewer.
// Screen: orthographic, sx = X, sy = GROUND - Y. front-compose.ts adds the centering offset.
// Bone lengths equal the side rig (BODY in rig.ts), so both views show the same figure.
//
// Drawing model:
// - A limb segment is one layer. Local +y runs along the bone. The layer scales y by projected length / bone
//   length (floor 0.05), so a bone that points at the viewer gets short. Round caps at both ends counter-scale,
//   so they stay circles. The orthographic projection of a capsule is a 2D capsule, so this is exact for
//   untapered limbs: a thigh that points at the viewer shows as a circle.
// - The torso is an animated path: the outline of elliptic cross-sections along a 3D spine curve.
// - Rigid parts (pelvis, head, collar, torso muscle frames) use the projected basis of their body part.
import { Bezier } from 'bezier-js';
import { ang, dir, dot, len, lerp, type Vec2 } from './math.ts';
import { IDENTITY, add3, addScaled3, cross3, ik3, inBasis, lerp3, mul3, norm3, rotAxis, sub3, turn, type Basis, type Vec3 } from './math3.ts';
import { BODY, GROUND } from './rig.ts';
import { PathBuilder, blob, box, ellipse, fill, group, oval, pathShape, smoothClosed, stroke, tr, type BezierPath, type LottieObject } from './lottie.ts';
import type { Palette } from './palettes.ts';

export type FSide = 'l' | 'r';
export type FLimb = 'thigh' | 'shin' | 'foot' | 'upper' | 'fore' | 'hand';
export type FSegPart = FLimb | 'neck';
export type FSegKey = `${FLimb}_${FSide}` | 'neck';
/** Torso layers that carry muscle highlights, at fixed spine positions. */
export type FTorsoFrame = 'chest' | 'abs' | 'lats' | 'traps';
export type FrontLayerKey = FSegKey | 'pelvis' | 'torso' | FTorsoFrame | 'collar' | 'head';

/** Default draw order, back to front. Arms in front of the torso, legs behind the shorts. */
export const FRONT_ORDER: FrontLayerKey[] = [
  'thigh_r', 'shin_r', 'foot_r', 'thigh_l', 'shin_l', 'foot_l', 'pelvis',
  'torso', 'abs', 'lats', 'chest', 'traps', 'neck', 'collar', 'head',
  'upper_r', 'fore_r', 'hand_r', 'upper_l', 'fore_l', 'hand_l',
];

/** Lateral body sizes in px. Thigh 94 px is about 45 cm, so 1 cm is about 2.1 px. */
export const FB = {
  /** Hip joint to body midline. */
  hipHalf: 17,
  /** Shoulder joint to body midline, at spine position shoulderS. */
  shoulderHalf: 33,
  shoulderS: 0.88,
  /** Ankle to toe tip. */
  foot: 38,
  /** Wrist to fingertips. Same as BODY.hand. */
  hand: BODY.hand,
  /** Height of the toe tip center above the ground when the foot is flat. */
  toeH: 7,
};

export const SEG_LEN: Record<FSegPart, number> = {
  thigh: BODY.thigh, shin: BODY.shin, foot: FB.foot, upper: BODY.upper, fore: BODY.fore, hand: FB.hand, neck: BODY.neck,
};

/** Spine positions of the torso muscle frames. */
export const TORSO_FRAME_S: Record<FTorsoFrame, number> = { chest: 0.8, abs: 0.5, lats: 0.68, traps: 0.97 };

export const project = (p: Vec3): Vec2 => [p[0], GROUND - p[1]];
/** Screen direction of a world direction. */
export const projDir = (v: Vec3): Vec2 => [v[0], -v[1]];

/** A value fixed for the pose, or computed from joints solved earlier in the same frame (legs before arms). */
export type Dyn3<T> = T | ((J: FrontJoints) => T);

/** Body-relative turn in degrees. See `turn` in math3.ts for the signs. */
export interface Turn {
  /** Positive turns the face toward the figure's left (screen right). */
  yaw?: number;
  /** Positive bends forward, toward the viewer. */
  pitch?: number;
  /** Positive bends sideways toward the figure's left (screen right). */
  roll?: number;
}

export interface FLimbSpec {
  /** World position of the ankle or wrist. */
  target: Dyn3<Vec3>;
  /** Direction the knee or elbow points. Default: knees forward and slightly out, elbows back and slightly out. */
  pole?: Dyn3<Vec3>;
  /**
   * Legs: ankle-to-toe direction. Default: pelvis forward on the ground, turned out 8°, toes FB.toeH above the
   * ground when the ankle is at BODY.ankleH. Use `toeDir` to build one. Arms: hand direction. Default: forearm.
   */
  dir?: Dyn3<Vec3>;
}

export interface FrontPose {
  /** Midpoint between the hip joints. Standing: [0, BODY.ankleH + about 182, 0]. */
  pelvis: Vec3;
  /** Pelvis orientation. Pitch tips the whole trunk forward from the hips. */
  hips?: Turn;
  /** Chest relative to pelvis: spinal flexion, side bend and twist. Lumbar takes 45 %, thoracic 55 %. */
  spine?: Turn;
  /** Neck relative to chest. */
  neck?: Turn;
  /** Head relative to neck. */
  head?: Turn;
  legs: Record<FSide, FLimbSpec>;
  arms: Record<FSide, FLimbSpec>;
  /** Shoulder elevation (up) and protraction (fwd) in px, in the chest basis. */
  shoulders?: Partial<Record<FSide, { up?: number; fwd?: number }>>;
}

type FJoint = 'hip' | 'knee' | 'ankle' | 'toe' | 'shoulder' | 'elbow' | 'wrist' | 'tip';

/** Solved front rig for one frame. World coordinates unless noted. */
export type FrontJoints = {
  /** Midpoint between the hip joints, spine joint, neck base, top of the neck (head joint), skull center. */
  pelvis: Vec3;
  M: Vec3;
  N: Vec3;
  E: Vec3;
  headCenter: Vec3;
  hips: Basis;
  chest: Basis;
  neckB: Basis;
  headB: Basis;
  /** Point, unit tangent and blended basis of the spine curve at s in [0, 1]. s=0 hips, s=1 neck base. */
  B: (s: number) => Vec3;
  T: (s: number) => Vec3;
  basisAt: (s: number) => Basis;
  /** Bone from a to b. x: optional lateral axis that sets the layer rotation when the bone points at the viewer. */
  seg: Record<FSegKey, { a: Vec3; b: Vec3; x?: Vec3 }>;
  /** Torso outline in screen coordinates, before centering. */
  torsoPts: Vec2[];
} & Record<`${FJoint}_${FSide}`, Vec3>;

const val = <T>(v: Dyn3<T> | undefined, J: FrontJoints): T | undefined => (typeof v === 'function' ? (v as (J: FrontJoints) => T)(J) : v);

/** Ankle-to-toe direction for a foot that points along `fwd` (any length) with the toes `drop` px below the ankle. */
export const toeDir = (fwd: Vec3, drop = BODY.ankleH - FB.toeH): Vec3 => {
  const f = norm3([fwd[0], 0, fwd[2]]);
  const h = Math.sqrt(Math.max(0, FB.foot * FB.foot - drop * drop));
  return norm3([f[0] * h, -drop, f[2] * h]);
};

// Torso half-width w and half-depth d along the spine: [s, w, d].
const TORSO: [number, number, number][] = [
  [0.17, 31, 16.5], [0.3, 29, 16], [0.42, 28, 15.8], [0.54, 28.5, 16.2], [0.64, 30, 17.5], [0.74, 32, 19],
  [0.83, 33.5, 19.2], [0.9, 33, 17.2], [0.95, 27, 14], [0.985, 17, 11], [1, 11, 10],
];
/** Depth to width ratio of the torso, used for the torso frames when the chest turns. */
export const TORSO_DEPTH = 0.56;
export const PELVIS_DEPTH = 0.5;

const blend = (a: Basis, b: Basis, u: number): Basis => ({ L: norm3(lerp3(a.L, b.L, u)), U: norm3(lerp3(a.U, b.U, u)), F: norm3(lerp3(a.F, b.F, u)) });
const part = (t: Turn, k: number): Turn => ({ yaw: (t.yaw ?? 0) * k, pitch: (t.pitch ?? 0) * k, roll: (t.roll ?? 0) * k });

export function solveFront(pose: FrontPose): FrontJoints {
  const H = pose.pelvis;
  const hips = turn(IDENTITY, pose.hips ?? {});
  const sp = pose.spine ?? {};
  const mid = turn(hips, part(sp, 0.45));
  const chest = turn(mid, part(sp, 0.55));
  const M = addScaled3(H, mid.U, BODY.lumbar);
  const N = addScaled3(M, chest.U, BODY.thoracic);
  // Quadratic Bezier spine (bezier-js, 3D), with the control point placed as in the side rig.
  const C = addScaled3(M, sub3(M, lerp3(H, N, 0.5)), 0.55);
  const spine = new Bezier([H, C, N].map(([x, y, z]) => ({ x, y, z })));
  const B = (s: number): Vec3 => { const p = spine.get(s); return [p.x, p.y, p.z!]; };
  const T = (s: number): Vec3 => { const d = spine.derivative(s); return norm3([d.x, d.y, d.z!]); };
  const basisAt = (s: number): Basis => (s <= 0.5 ? blend(hips, mid, s / 0.5) : blend(mid, chest, (s - 0.5) / 0.5));

  const neckB = turn(chest, pose.neck ?? {});
  const E = addScaled3(N, neckB.U, BODY.neck);
  const headB = turn(neckB, pose.head ?? {});
  const J = {
    pelvis: H, M, N, E, hips, chest, neckB, headB, B, T, basisAt,
    headCenter: inBasis(E, headB, [0, 23, 1]),
    seg: {} as FrontJoints['seg'],
  } as FrontJoints;
  J.seg.neck = { a: N, b: E };

  const sides = [['l', 1], ['r', -1]] as const;
  for (const [s, sign] of sides) {
    J[`hip_${s}`] = inBasis(H, hips, [FB.hipHalf * sign, 0, 0]);
    const sh = pose.shoulders?.[s] ?? {};
    J[`shoulder_${s}`] = inBasis(B(FB.shoulderS), chest, [FB.shoulderHalf * sign, sh.up ?? 0, sh.fwd ?? 0]);
  }
  // Legs first, so arm targets may depend on knees and ankles.
  for (const [s, sign] of sides) {
    const spec = pose.legs[s];
    const hip = J[`hip_${s}`];
    const pole = val(spec.pole, J) ?? norm3(addScaled3(hips.F, hips.L, 0.15 * sign));
    const target = val(spec.target, J);
    if (!target) throw new Error(`leg.${s}: target is required`);
    const r = ik3(hip, target, BODY.thigh, BODY.shin, pole, `leg.${s}`);
    J[`knee_${s}`] = r.mid; J[`ankle_${s}`] = r.end;
    const d = val(spec.dir, J) ?? toeDir(rotAxis([hips.F[0], 0, hips.F[2]], [0, 1, 0], 8 * sign));
    J[`toe_${s}`] = addScaled3(r.end, norm3(d), FB.foot);
    J.seg[`thigh_${s}`] = { a: hip, b: r.mid };
    J.seg[`shin_${s}`] = { a: r.mid, b: r.end };
    J.seg[`foot_${s}`] = { a: r.end, b: J[`toe_${s}`], x: norm3(cross3([0, 1, 0], d)) };
  }
  for (const [s, sign] of sides) {
    const spec = pose.arms[s];
    const sh = J[`shoulder_${s}`];
    const pole = val(spec.pole, J) ?? norm3(addScaled3(mul3(chest.F, -1), chest.L, 0.35 * sign));
    const target = val(spec.target, J);
    if (!target) throw new Error(`arm.${s}: target is required`);
    const r = ik3(sh, target, BODY.upper, BODY.fore, pole, `arm.${s}`);
    J[`elbow_${s}`] = r.mid; J[`wrist_${s}`] = r.end;
    const d = val(spec.dir, J) ?? norm3(sub3(r.end, r.mid));
    J[`tip_${s}`] = addScaled3(r.end, norm3(d), FB.hand);
    J.seg[`upper_${s}`] = { a: sh, b: r.mid };
    J.seg[`fore_${s}`] = { a: r.mid, b: r.end };
    J.seg[`hand_${s}`] = { a: r.end, b: J[`tip_${s}`] };
  }
  J.torsoPts = torsoOutline(J);
  return J;
}

/** Half extent of an elliptic cross-section (axes a, b in screen space) along the screen direction p. */
const extent = (a: Vec2, b: Vec2, p: Vec2): number => len([dot(a, p), dot(b, p)]);

function torsoOutline(J: FrontJoints): Vec2[] {
  const right: Vec2[] = [], left: Vec2[] = [];
  let t2: Vec2 = [0, -1];
  for (const [s, w, d] of TORSO) {
    const c = project(J.B(s));
    const tp = projDir(J.T(s));
    // Keep the previous direction when the spine points at the viewer.
    if (len(tp) > 0.2) t2 = [tp[0] / len(tp), tp[1] / len(tp)];
    const p2: Vec2 = [-t2[1], t2[0]];
    const bs = J.basisAt(s);
    const h = extent(projDir(mul3(bs.L, w)), projDir(mul3(bs.F, d)), p2);
    right.push([c[0] + p2[0] * h, c[1] + p2[1] * h]);
    left.push([c[0] - p2[0] * h, c[1] - p2[1] * h]);
  }
  const top = project(add3(J.B(1), mul3(J.T(1), 5)));
  return [...right, top, ...left.reverse()];
}

/** Screen frame of a rigid part: position, rotation in degrees and scale factors for its basis. */
export interface ScreenFrame {
  p: Vec2;
  r: number;
  s: Vec2;
}

/**
 * Screen frame of a body part with basis b at origin o. Local +x follows the projected L axis, local -y the
 * projected U axis. `depth` is the depth to width ratio: a part turned 90° keeps that fraction of its width.
 * `scale: false` keeps the size, for the head.
 */
export function rigidFrame(o: Vec3, b: Basis, depth: number, scale = true): ScreenFrame {
  const u2 = projDir(b.U), l2 = projDir(b.L), f2 = projDir(b.F);
  const r = len(u2) > 0.15 ? ang(u2) + 90 : ang(l2);
  // Screen axes of the layer: local +x and local +y.
  const ex = dir(r), ey = dir(r + 90);
  const s: Vec2 = scale ? [len([dot(l2, ex), depth * dot(f2, ex)]), len([dot(u2, ey), depth * dot(f2, ey)])] : [1, 1];
  return { p: project(o), r, s };
}

// ---------- Part shapes (local coordinates, y down) ----------

/** Straight-sided taper along +y from radius r0 at y=0 to r1 at y=L. The caps are separate. */
const taper = (L: number, r0: number, r1: number, y0 = 0, y1 = L): BezierPath => {
  const ra = lerp(r0, r1, y0 / L), rb = lerp(r0, r1, y1 / L);
  return new PathBuilder().move([-ra, y0]).line([ra, y0]).line([rb, y1]).line([-rb, y1]).line([-ra, y0]).build();
};
const disc = (nm: string, hex: string, r: number): LottieObject => oval(nm, hex, [0, 0], [2 * r, 2 * r]);

/** Shapes of one limb segment: the body scales with the projected length; the caps stay round. Back to front. */
export interface SegShapes {
  body: LottieObject[];
  /** Cap at the root joint (y=0) and at the end joint (y=L). */
  root: LottieObject[];
  end: LottieObject[];
}

export function segShapes(p: FSegPart, pal: Palette, far: boolean): SegShapes {
  const skin = far ? pal.skinFar : pal.skin;
  const shirt = far ? pal.shirtFar : pal.shirt;
  const shorts = far ? pal.shortsFar : pal.shorts;
  const shoe = far ? pal.shoeFar : pal.shoe;
  const sock = far ? pal.sockFar : pal.sock;
  const accent = far ? pal.shoeAccentFar : pal.shoeAccent;
  const trim = far ? pal.shirtTrimFar : pal.shirtTrim;
  const L = SEG_LEN[p];
  switch (p) {
    case 'thigh': {
      const hem = 46, rh = lerp(17, 12, hem / L) + 2;
      const shortsLeg = new PathBuilder().move([-19.4, 0]).line([19.4, 0]).line([rh, hem]).line([-rh, hem]).line([-19.4, 0]).build();
      return { body: [blob('skin', skin, taper(L, 17, 12)), blob('shorts', shorts, shortsLeg)], root: [disc('hip', shorts, 19.4)], end: [disc('knee', skin, 12)] };
    }
    case 'shin': return {
      body: [
        blob('skin', skin, taper(L, 12, 8)), oval('calf', skin, [0, 28], [25, 44]),
        box('sock', sock, [0, 80], [19.2, 20], 3), box('sock-band', accent, [0, 71.2], [19.6, 2.6], 1.3),
      ],
      root: [disc('knee', skin, 12)], end: [disc('ankle', sock, 9.6)],
    };
    case 'foot': return {
      body: [blob('sole', pal.sole, taper(L, 11.6, 13.1)), blob('shoe', shoe, taper(L, 10, 11.5))],
      // Seen from the front, a shoe is wider than tall, so the caps are ovals wider across the foot.
      root: [oval('heel-edge', pal.sole, [0, 0], [24.2, 19]), oval('heel', shoe, [0, 0], [21, 15.8])],
      // Laces sit on top of the foot, between ankle and toe. Seen from the front they show above the toe box.
      end: [
        oval('toe-edge', pal.sole, [0, 0], [27.2, 19.6]), oval('toe', shoe, [0, 0], [24, 16.4]),
        box('laces', accent, [0, -4.6], [10, 3.4], 1.7),
      ],
    };
    case 'upper': {
      const hem = 26, rs = 13.2, rh = lerp(11, 8.5, hem / L) + 1.9;
      const sleeve = new PathBuilder().move([-rs, 0]).line([rs, 0]).line([rh, hem]).line([-rh, hem]).line([-rs, 0]).build();
      const trimPath = new PathBuilder().move([-rh, hem - 3.6]).line([rh, hem - 3.6]).line([rh, hem]).line([-rh, hem]).line([-rh, hem - 3.6]).build();
      return { body: [blob('skin', skin, taper(L, 11, 8.5)), blob('sleeve', shirt, sleeve), blob('sleeve-trim', trim, trimPath)], root: [disc('shoulder', shirt, rs)], end: [disc('elbow', skin, 8.5)] };
    }
    case 'fore': return { body: [blob('skin', skin, taper(L, 8.8, 6.4)), oval('forearm', skin, [0, 17], [19, 28])], root: [disc('elbow', skin, 8.8)], end: [disc('wrist', skin, 6.4)] };
    case 'hand': return { body: [blob('skin', skin, taper(L, 6.6, 6.2))], root: [disc('wrist', skin, 6.6)], end: [disc('fingers', skin, 6.2)] };
    case 'neck': return { body: [blob('skin', skin, taper(L, 8.8, 8.4))], root: [disc('neck-base', skin, 8.8)], end: [disc('neck-top', skin, 8.4)] };
  }
}

/** Shorts seen from the front, in the pelvis frame. The hip joints sit at (±17, 0). */
export function pelvisShapes(pal: Palette): LottieObject[] {
  const pts: Vec2[] = [[-32.5, -27], [32.5, -27], [35.5, -12], [37, 2], [37.5, 14], [22, 17.5], [4, 10], [0, 9], [-4, 10], [-22, 17.5], [-37.5, 14], [-37, 2], [-35.5, -12]];
  return [blob('shorts', pal.shorts, smoothClosed(pts, [0, 1, 4, 9])), box('waistband', pal.band, [0, -24], [64, 6], 2.5)];
}

/** Crew-neck collar in the chest frame at the neck base: a U-shaped band in front of the neck. */
export function frontCollarShapes(pal: Palette): LottieObject[] {
  const u: BezierPath = { c: false, v: [[-12.5, -3], [12.5, -3]], i: [[0, 0], [-4, 9]], o: [[4, 9], [0, 0]] };
  return [group('collar', [pathShape(u), stroke(pal.shirtTrim, 3.4)])];
}

/** Head seen from the front, in the head frame. The head joint (top of the neck) is at (0, 0). */
export const headBackShapes = (pal: Palette): LottieObject[] => [
  oval('ear-l', pal.skinShade, [20.5, -21], [8.5, 12]),
  oval('ear-r', pal.skinShade, [-20.5, -21], [8.5, 12]),
  oval('skull', pal.skin, [0, -23], [41, 47]),
  oval('jaw', pal.skin, [0, -11], [30, 22]),
];

/** Face features. front-compose.ts moves this group with the head turn and hides it when the face turns away. */
export const faceShapes = (pal: Palette): LottieObject[] => [
  group('blush', [ellipse([13.5, -16], [8, 5]), ellipse([-13.5, -16], [8, 5]), { ...fill(pal.blush), o: { a: 0, k: pal.blushOpacity } }]),
  oval('nose', pal.skinShade, [0, -18.5], [4.6, 3.4]),
  oval('eye-l', pal.eye, [8, -24.5], [4.8, 6.2]),
  oval('eye-r', pal.eye, [-8, -24.5], [4.8, 6.2]),
  oval('eye-shine-l', pal.eyeShine, [7.1, -26], [1.8, 1.8]),
  oval('eye-shine-r', pal.eyeShine, [-8.9, -26], [1.8, 1.8]),
  box('brow-l', pal.hair, [8.5, -31.5], [8, 2.4], 1.2, 7),
  box('brow-r', pal.hair, [-8.5, -31.5], [8, 2.4], 1.2, -7),
  group('smile', [pathShape({ c: false, v: [[-5.5, -13], [5.5, -13]], i: [[0, 0], [-2.2, 3]], o: [[2.2, 3], [0, 0]] }), stroke(pal.mouth, 1.7)]),
];

/** Hair with a side part, drawn over the face. */
export const hairShapes = (pal: Palette): LottieObject[] => [
  blob('hair', pal.hair, smoothClosed([
    [-22.5, -18], [-24, -30], [-20, -43], [-10, -50.5], [3, -52], [15, -48], [22.5, -38], [24, -26], [22.5, -17],
    [19.5, -26], [16, -35], [8, -39.5], [-4, -40.5], [-12, -38.5], [-17.5, -33], [-19.5, -24],
  ], [0, 8])),
  oval('hair-shine', pal.hairShine, [-6, -46], [12, 3.4], -8),
];

/** Back of the head: shown instead of the face when the face turns away from the viewer. */
export const headTurnedAwayShapes = (pal: Palette): LottieObject[] => [oval('hair-back', pal.hair, [0, -25], [43, 47])];

// ---------- Muscle highlights ----------

/**
 * Highlight ellipse in front view. `part` is a limb segment, the neck, the pelvis or a torso frame.
 * Local coordinates: y down; on a segment, +y runs from the root joint along the bone.
 * `mirror`: draw a second ellipse at (-x, y) rotated by -r (torso and pelvis, both sides of the body).
 * `inner`: on a limb, x points toward the body midline; the composer flips it per side.
 */
export interface FrontRegion {
  view: 'front';
  part: FSegPart | 'pelvis' | FTorsoFrame;
  c: Vec2;
  s: Vec2;
  r?: number;
  mirror?: boolean;
  inner?: boolean;
}

const fr = (part: FrontRegion['part'], c: Vec2, s: Vec2, extra: Partial<FrontRegion> = {}): FrontRegion => ({ view: 'front', part, c, s, ...extra });

/** Default front-view regions. null: the muscle faces away from the viewer. The composer skips it with a warning unless MuscleSpec.region is given. */
export const FRONT_MUSCLES: Record<import('./rig.ts').MuscleKey, FrontRegion | null> = {
  pecs: fr('chest', [15, -1], [24, 17], { mirror: true }),
  abs: fr('abs', [0, 0], [18, 44]),
  obliques: fr('abs', [21.5, 2], [8, 32], { r: 8, mirror: true }),
  lats: fr('lats', [28.5, 0], [8, 30], { r: 5, mirror: true }),
  traps: fr('traps', [13.5, 1], [15, 7], { r: 22, mirror: true }),
  delts: fr('upper', [0, 4], [27, 22]),
  biceps: fr('upper', [0, 36], [13, 30]),
  forearms: fr('fore', [0, 20], [14, 30]),
  quads: fr('thigh', [0, 54], [22, 54]),
  adductors: fr('thigh', [10, 28], [9, 40], { inner: true }),
  abductors: fr('pelvis', [33.5, -3], [8, 22], { mirror: true }),
  hipFlexor: fr('pelvis', [16, 4], [12, 15], { r: 35, mirror: true }),
  calves: fr('shin', [6, 30], [9, 34], { inner: true }),
  neck: fr('neck', [0, 9], [14, 13]),
  triceps: null, glutes: null, hamstrings: null, lowerBack: null, upperBack: null,
};
