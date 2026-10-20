// Private builders for chest-fly-1. The standing variants use a frontal view so the shoulder arc and cable direction remain visible.
// Each arm keeps a soft, fixed elbow bend by travelling on a constant-radius arc from the shoulder.
// Cable grips are always bound to their handles, while both feet remain planted throughout the standing variants.
import type { FrontExercise, Props } from '@/exercise.ts';
import { timeline, type Timeline, type Vec2 } from '@/math.ts';
import { add3, lerp3, mul3, norm3, type Vec3 } from '@/math3.ts';
import { FB, type FSide, type FrontJoints } from '@/front-rig.ts';
import { BODY, GROUND } from '@/rig.ts';
import {
  bandLine, cableColumn, cableHandle, cableLine, frontGripAt, towardCable, workTL,
  stabilityBall,
} from '@/exercises/equipment/index.ts';

const G = GROUND;
const REACH = BODY.upper + BODY.fore - 2.2;
const SIGN: Record<FSide, number> = { l: 1, r: -1 };

type Style = 'mid' | 'cross' | 'high-low' | 'low-high' | 'iron-cross';

export type CableFlyOptions = {
  id: string;
  name: string;
  en: string;
  sources: string[];
  style: Style;
  pulleyY: number;
  lean?: number;
  straight?: boolean;
};

/** Constant arm length gives a safe, repeatable soft elbow angle throughout the shoulder arc. */
function ray(a: Vec3, b: Vec3, p: number, reach = REACH): Vec3 {
  return mul3(norm3(lerp3(a, b, p)), reach);
}

function deltas(style: Style, s: FSide): { open: Vec3; closed: Vec3; reach: number } {
  const x = SIGN[s];
  switch (style) {
    case 'high-low':
      // High cable: open at shoulder level, then sweep down and in toward the lower sternum.
      return { open: [x * 108, 0, 52], closed: [-x * 22, -67, 102], reach: REACH };
    case 'low-high':
      // Low cable: hands begin beside the hips and finish together in front of the upper chest.
      return { open: [x * 62, -105, 25], closed: [-x * 22, 14, 116], reach: REACH };
    case 'iron-cross':
      // This named movement is a straight-arm shoulder adduction from a T to the thighs.
      return { open: [x * 124, 0, 4], closed: [x * 2, -124, 4], reach: BODY.upper + BODY.fore - 0.4 };
    case 'cross':
      // Each hand passes the midline. The final positions make the crossover readable from the front.
      return { open: [x * 108, 0, 52], closed: [-x * 46, 12, 112], reach: REACH };
    case 'mid':
      return { open: [x * 108, 0, 52], closed: [-x * 23, 10, 117], reach: REACH };
  }
}

function arm(s: FSide, p: number, style: Style, straight = false) {
  const d = deltas(style, s);
  const reach = straight ? BODY.upper + BODY.fore - 0.4 : d.reach;
  return {
    target: (J: FrontJoints) => add3(J[`shoulder_${s}`], ray(d.open, d.closed, p, reach)),
    // The elbow stays in front of the chest instead of folding behind the torso.
    pole: (J: FrontJoints) => add3(J.chest.F, mul3(J.chest.L, SIGN[s] * 0.22)),
  };
}

function standingPose(p: number, style: Style, lean = 0, straight = false) {
  return {
    // A 183.75 px ankle-to-pelvis height gives standing knees about 175°, not the visibly soft 168° default.
    pelvis: [0, BODY.ankleH + 183.75, 0] as Vec3,
    hips: { pitch: lean },
    spine: { pitch: -2 },
    head: { pitch: -3 },
    // Feet are hip-width. The small Z offset makes one foot read as the forward foot without losing ground contact.
    legs: {
      l: { target: [18, BODY.ankleH, 5] as Vec3 },
      r: { target: [-18, BODY.ankleH, -5] as Vec3 },
    },
    arms: { l: arm('l', p, style, straight), r: arm('r', p, style, straight) },
  };
}

function cableStation(pulleyY: number): { props: (pal: Parameters<NonNullable<FrontExercise['props']>>[0]) => Props; box: [number, number]; left: Vec2; right: Vec2 } {
  const left = cableColumn({ x: -215, pulleyY, toward: 1 });
  const right = cableColumn({ x: 215, pulleyY, toward: -1 });
  return {
    props: (pal) => ({ back: [...left.draw(pal), ...right.draw(pal)] }),
    box: [left.box[0], right.box[1]], left: left.pulley, right: right.pulley,
  };
}

function cableParts(left: Vec2, right: Vec2) {
  const grip = (s: FSide, J: FrontJoints): Vec2 => frontGripAt(J, s);
  return [
    cableLine(left, (J: FrontJoints) => grip('l', J), 'Left Cable'),
    cableLine(right, (J: FrontJoints) => grip('r', J), 'Right Cable'),
    cableHandle('d', (J: FrontJoints) => {
      const p = grip('l', J);
      return { p, a: towardCable(p, left) };
    }, { z: 'front' }),
    cableHandle('d', (J: FrontJoints) => {
      const p = grip('r', J);
      return { p, a: towardCable(p, right) };
    }, { z: 'front' }),
  ];
}

/** Bilateral cable fly or crossover with pulleys fixed at the supplied height. */
export function makeCableFly(options: CableFlyOptions): FrontExercise {
  const tl = workTL(0.35);
  const station = cableStation(options.pulleyY);
  return {
    id: options.id,
    name: options.name,
    view: 'front',
    tl,
    meta: { en: options.en, family: 'chest-fly', equipment: ['cable'], sources: options.sources },
    muscles: [{ m: 'pecs' }, { m: 'delts', scale: 0.45 }, { m: 'biceps', side: 'both', scale: 0.3 }],
    props: station.props,
    propsBox: station.box,
    dynamic: cableParts(station.left, station.right),
    pose: (t) => standingPose(tl.at(t).p, options.style, options.lean ?? 0, options.straight ?? false),
  };
}

/** One right-side repetition followed by one left-side repetition. The idle hand remains in front of the chest. */
export function makeAlternatingHighCable(id: string, name: string, en: string, sources: string[]): FrontExercise {
  const tl: Timeline = timeline([
    { d: 0.8, from: 0, to: 1, e: [0.45, 0.82] }, { d: 0.2, from: 1, to: 1, e: [0.82, 0.82] },
    { d: 0.8, from: 1, to: 0, e: [0.72, 0.4] }, { d: 0.3, from: 0, to: 0, e: [0.35, 0.35] },
    { d: 0.8, from: 0, to: 1, e: [0.45, 0.82] }, { d: 0.2, from: 1, to: 1, e: [0.82, 0.82] },
    { d: 0.8, from: 1, to: 0, e: [0.72, 0.4] }, { d: 0.3, from: 0, to: 0, e: [0.35, 0.35] },
  ]);
  const station = cableStation(66);
  return {
    id, name, view: 'front', tl,
    meta: { en, family: 'chest-fly', equipment: ['cable'], sources },
    muscles: [{ m: 'pecs' }, { m: 'delts', scale: 0.4 }],
    props: station.props, propsBox: station.box, dynamic: cableParts(station.left, station.right),
    pose(t) {
      const phase = tl.at(t);
      // The first half trains the figure's right arm. Each half begins and ends with both handles together.
      const active: FSide = t < 0.5 ? 'r' : 'l';
      const open = (s: FSide): Vec3 => [SIGN[s] * 108, 0, 52];
      const closed = (s: FSide): Vec3 => [-SIGN[s] * 23, 8, 117];
      const armAt = (s: FSide) => {
        const p = s === active ? 1 - phase.p : 1;
        return {
          target: (J: FrontJoints) => add3(J[`shoulder_${s}`], ray(open(s), closed(s), p)),
          pole: (J: FrontJoints) => add3(J.chest.F, mul3(J.chest.L, SIGN[s] * 0.22)),
        };
      };
      return {
        pelvis: [0, BODY.ankleH + 183.75, 0], hips: { pitch: 7 }, spine: { pitch: -2 }, head: { pitch: -3 },
        legs: { l: { target: [18, BODY.ankleH, 5] }, r: { target: [-18, BODY.ankleH, -5] } },
        arms: { l: armAt('l'), r: armAt('r') },
      };
    },
  };
}

/** Band crossover from a single chest-height post behind the torso. */
export function makeBandCrossover(id: string, name: string, en: string, sources: string[]): FrontExercise {
  const tl = workTL(0.35);
  const anchor: Vec2 = [0, 154];
  return {
    id, name, view: 'front', tl,
    meta: { en, family: 'chest-fly', equipment: ['band'], sources },
    muscles: [{ m: 'pecs' }, { m: 'delts', scale: 0.4 }, { m: 'biceps', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [
      // The post rises above the shoulders so the rear anchor remains recognizable in a front view.
      { kind: 'box', nm: 'anchor-post', color: pal.prop, c: [0, (38 + G) / 2], s: [20, G - 38], r: 5 },
      { kind: 'oval', nm: 'band-anchor', color: pal.metal, c: anchor, s: [18, 18] },
    ] }),
    dynamic: [
      // The two band limbs leave the same rear anchor and stay visible over the shirt before the hands cover them.
      bandLine((J: FrontJoints) => [anchor, frontGripAt(J, 'l')], 'front', 'Left Band'),
      bandLine((J: FrontJoints) => [anchor, frontGripAt(J, 'r')], 'front', 'Right Band'),
    ],
    pose: (t) => standingPose(tl.at(t).p, 'cross', 2),
  };
}

/** Palms press together at the sternum. The small movement releases and reapplies tension without changing the elbow bend. */
export function makeChestSqueeze(id: string, name: string, en: string, sources: string[]): FrontExercise {
  const tl = timeline([
    { d: 1.0, from: 0, to: 1, e: [0.35, 1] }, { d: 3.0, from: 1, to: 1, e: [1, 0.95] },
    { d: 1.0, from: 1, to: 0, e: [0.95, 0.35] }, { d: 0.6, from: 0, to: 0, e: [0.3, 0.3] },
  ]);
  return {
    id, name, view: 'front', tl,
    meta: { en, family: 'chest-fly', equipment: ['bodyweight'], sources },
    muscles: [{ m: 'pecs' }, { m: 'delts', scale: 0.3 }],
    pose(t) {
      const p = tl.at(t).p;
      const pressArm = (s: FSide) => ({
        // About 90 degrees at each elbow. The wrists move only 8 px toward the centre while force rises.
        target: (J: FrontJoints) => add3(J[`shoulder_${s}`], ray([SIGN[s] * -18, -12, 83], [SIGN[s] * -31, -12, 82], p, 88)),
        pole: (J: FrontJoints) => add3(J.chest.F, mul3(J.chest.L, SIGN[s] * 0.35)),
        dir: [0, 0, 1] as Vec3,
      });
      return {
        pelvis: [0, BODY.ankleH + 183.9, 0], hips: { pitch: 1 }, head: { pitch: -2 },
        legs: { l: { target: [18, BODY.ankleH, 3] }, r: { target: [-18, BODY.ankleH, -3] } },
        arms: { l: pressArm('l'), r: pressArm('r') },
      };
    },
  };
}

/** One arm works at a time while seated upright on a stability ball. The cable and handle follow the working hand. */
export function makeSingleBallCableFly(id: string, name: string, en: string, sources: string[]): FrontExercise {
  const tl: Timeline = timeline([
    { d: 0.8, from: 0, to: 1, e: [0.4, 0.82] }, { d: 0.2, from: 1, to: 1, e: [0.82, 0.82] },
    { d: 0.8, from: 1, to: 0, e: [0.72, 0.35] }, { d: 0.3, from: 0, to: 0, e: [0.3, 0.3] },
    { d: 0.8, from: 0, to: 1, e: [0.4, 0.82] }, { d: 0.2, from: 1, to: 1, e: [0.82, 0.82] },
    { d: 0.8, from: 1, to: 0, e: [0.72, 0.35] }, { d: 0.3, from: 0, to: 0, e: [0.3, 0.3] },
  ]);
  const left = cableColumn({ x: -215, pulleyY: 156, toward: 1 });
  const right = cableColumn({ x: 215, pulleyY: 156, toward: -1 });
  const activeSide = (t: number): FSide => (t < 0.5 ? 'r' : 'l');
  const activePulley = (t: number): Vec2 => (activeSide(t) === 'l' ? left.pulley : right.pulley);
  return {
    id, name, view: 'front', tl,
    meta: { en, family: 'chest-fly', equipment: ['cable', 'stability-ball'], sources },
    muscles: [{ m: 'pecs', side: 'r' }, { m: 'pecs', side: 'l', scale: 1, e: (t) => (t >= 0.5 ? tl.at(t).e : 0.16) }, { m: 'delts', scale: 0.4 }],
    props: (pal) => ({ back: [...left.draw(pal), ...right.draw(pal)] }),
    propsBox: [left.box[0], right.box[1]],
    dynamic: [
      stabilityBall(() => ({ p: [0, G - 68] }), 'overFarArm'),
      {
        nm: 'Working Cable', kind: 'line', z: 'back', width: 2.2, color: (pal) => pal.cable,
        at: (J: FrontJoints, t: number) => [activePulley(t), frontGripAt(J, activeSide(t))],
      },
      cableHandle('d', (J: FrontJoints, t: number) => {
        const p = frontGripAt(J, activeSide(t));
        return { p, a: towardCable(p, activePulley(t)) };
      }, { z: 'front' }),
    ],
    pose(t) {
      const phase = tl.at(t);
      const active = activeSide(t);
      const activeArm = (s: FSide) => s === active ? arm(s, 1 - phase.p, 'mid') : arm(s, 1, 'mid');
      return {
        pelvis: [0, 142, 0], hips: { pitch: 2 }, spine: { pitch: -2 }, head: { pitch: -2 },
        // Feet are broad and flat. The ball stays below the pelvis and behind the thighs.
        legs: { l: { target: [62, BODY.ankleH, 34] }, r: { target: [-62, BODY.ankleH, 26] } },
        arms: { l: activeArm('l'), r: activeArm('r') },
      };
    },
  };
}

/** Bilateral seated stability-ball fly. The source sets high pulleys, so cables slope down to both hands. */
export function makeBallCableFly(id: string, name: string, en: string, sources: string[]): FrontExercise {
  const tl = workTL(0.35);
  const station = cableStation(66);
  return {
    id, name, view: 'front', tl,
    meta: { en, family: 'chest-fly', equipment: ['cable', 'stability-ball'], sources },
    muscles: [{ m: 'pecs' }, { m: 'delts', scale: 0.4 }],
    props: station.props, propsBox: station.box,
    dynamic: [stabilityBall(() => ({ p: [0, G - 68] }), 'overFarArm'), ...cableParts(station.left, station.right)],
    pose: (t) => ({
      pelvis: [0, 142, 0], hips: { pitch: 7 }, spine: { pitch: -2 }, head: { pitch: -3 },
      legs: { l: { target: [62, BODY.ankleH, 34] }, r: { target: [-62, BODY.ankleH, 26] } },
      arms: { l: arm('l', tl.at(t).p, 'mid'), r: arm('r', tl.at(t).p, 'mid') },
    }),
  };
}

export { arm, cableParts, cableStation, ray, standingPose };
