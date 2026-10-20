// Chair alternating leg extension and abduction, front view. Sit upright and grip the chair seat while the feet begin flat.
// One knee extends from 92° to 170–175° with a flexed ankle. The straight leg then moves out to the side.
// The pelvis, torso, hands, and the inactive foot stay fixed. The left leg completes the path before the right leg repeats it.
import type { FrontExercise } from '@/exercise.ts';
import { timeline, lerp } from '@/math.ts';
import { toeDir, type FSide, type FrontPose } from '@/front-rig.ts';
import type { Vec3 } from '@/math3.ts';
import { BODY } from '@/rig.ts';

const tl = timeline([
  { d: 0.7, from: 0, to: 1, e: [0.3, 0.95] },
  { d: 0.35, from: 1, to: 2, e: [0.8, 1] },
  { d: 0.7, from: 2, to: 0, e: [0.9, 0.3] },
  { d: 0.7, from: 0, to: -1, e: [0.3, 0.95] },
  { d: 0.35, from: -1, to: -2, e: [0.8, 1] },
  { d: 0.7, from: -2, to: 0, e: [0.9, 0.3] },
]);

const sideSign = (side: FSide): number => side === 'l' ? 1 : -1;
// Grounded ankles sit 132 px from the hips, giving a natural seated 92° knee bend.
const restTarget = (side: FSide): Vec3 => [sideSign(side) * 28, BODY.ankleH, 83.5];
// Both raised positions stay just inside the 184 px two-bone reach. This preserves a 170–175° knee while the leg moves laterally.
const raisedTarget = (side: FSide): Vec3 => [sideSign(side) * 30, 80, 179.5];
const outwardTarget = (side: FSide): Vec3 => [sideSign(side) * 129, 90, 143];

function legAt(side: FSide, t: number): FrontPose['legs'][FSide] {
  const q = tl.at(t).p;
  const active: FSide | null = q > 0 ? 'l' : q < 0 ? 'r' : null;
  const amount = active === side ? Math.abs(q) : 0;
  const sign = sideSign(side);
  const target = amount <= 1
    ? (amount === 0 ? restTarget(side) : [
      lerp(restTarget(side)[0], raisedTarget(side)[0], amount),
      lerp(restTarget(side)[1], raisedTarget(side)[1], amount),
      lerp(restTarget(side)[2], raisedTarget(side)[2], amount),
    ] as Vec3)
    : [
      lerp(raisedTarget(side)[0], outwardTarget(side)[0], amount - 1),
      lerp(raisedTarget(side)[1], outwardTarget(side)[1], amount - 1),
      lerp(raisedTarget(side)[2], outwardTarget(side)[2], amount - 1),
    ] as Vec3;
  return {
    target,
    // Raised toes pull toward the shin, rather than pointing away from it.
    dir: amount > 0 ? toeDir([0, 0, 1], -5) : toeDir([0, 0, 1]),
    // Keep the seated knee in front of the hip and slightly outside the body line.
    pole: [sign * 0.2, 0, 1],
  };
}

const activeAmount = (t: number, side: FSide): number => {
  const q = tl.at(t).p;
  return (q > 0 ? 'l' : q < 0 ? 'r' : null) === side ? Math.abs(q) : 0;
};
const quadEffort = (t: number, side: FSide): number => 0.18 + 0.82 * Math.min(1, activeAmount(t, side));
const abductionEffort = (t: number, side: FSide): number => 0.12 + 0.88 * Math.max(0, activeAmount(t, side) - 1);

export default {
  id: 'chair-alternating-leg-extension-and-abduction',
  name: '坐姿交替伸腿外展',
  view: 'front',
  tl,
  meta: {
    en: 'Chair Alternating Leg Extension and Abduction',
    family: 'leg-extension',
    equipment: ['chair'],
    sources: ['fe:Chair_Leg_Extended_Stretch'],
  },
  muscles: [
    { m: 'quads', side: 'l', e: (t) => quadEffort(t, 'l') },
    { m: 'quads', side: 'r', e: (t) => quadEffort(t, 'r') },
    { m: 'hipFlexor', side: 'l', scale: 0.45, e: (t) => quadEffort(t, 'l') },
    { m: 'hipFlexor', side: 'r', scale: 0.45, e: (t) => quadEffort(t, 'r') },
    { m: 'abductors', side: 'l', scale: 0.65, e: (t) => abductionEffort(t, 'l') },
    { m: 'abductors', side: 'r', scale: 0.65, e: (t) => abductionEffort(t, 'r') },
  ],
  props: (pal) => ({
    back: [
      // Front-view world coordinates share the rig origin, not the 512 px canvas center.
      { kind: 'box', nm: 'chair-back', color: pal.padFar, c: [0, 276], s: [178, 132], r: 12 },
      { kind: 'box', nm: 'chair-seat', color: pal.pad, c: [0, 345], s: [194, 18], r: 8 },
      { kind: 'box', nm: 'chair-leg-left', color: pal.metalDark, c: [-76, 398], s: [15, 106], r: 5 },
      { kind: 'box', nm: 'chair-leg-right', color: pal.metalDark, c: [76, 398], s: [15, 106], r: 5 },
    ],
  }),
  propsBox: [-92, 92],
  pose(t): FrontPose {
    return {
      pelvis: [0, 115, 0],
      legs: { l: legAt('l', t), r: legAt('r', t) },
      arms: {
        // Hands close around the outside edges of the seat.
        l: { target: [82, 122, 18], pole: [1, 0, -1] },
        r: { target: [-82, 122, 18], pole: [-1, 0, -1] },
      },
    };
  },
} satisfies FrontExercise;
