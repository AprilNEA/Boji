// Stand tall facing away from a low band anchor, with one ankle attached to the band.
// Raise that knee to hip height while the standing foot, chest, and low anchor remain fixed.
// Return the foot slowly to the floor before the next repetition.
import type { SideExercise } from '@/exercise.ts';
import { lerp, lerpV, type Vec2 } from '@/math/vec2.ts';
import { A, G } from '@/exercises/common.ts';
import { bandLine, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.35);
const X0 = 276;
const HIP: Vec2 = [X0, G - A - 183.8];
const ANCHOR: Vec2 = [174, G - 30];

export default {
  id: 'band-standing-hip-flexion',
  name: '弹力带站姿屈髋',
  tl,
  meta: {
    en: 'Band Standing Hip Flexion',
    family: 'misc',
    equipment: ['band', 'other'],
    sources: ['fe:Hip_Flexion_with_Band'],
  },
  muscles: [
    { m: 'hipFlexor', side: 'near' },
    { m: 'quads', side: 'near', scale: 0.35 },
    { m: 'abs', scale: 0.3 },
  ],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'anchor-post', color: pal.metal, c: [ANCHOR[0], G - 122], s: [18, 246], r: 6 },
    { kind: 'box', nm: 'anchor-base', color: pal.metalDark, c: [ANCHOR[0], G - 5], s: [70, 10], r: 4 },
    { kind: 'oval', nm: 'low-anchor-ring', color: pal.metalDark, c: ANCHOR, s: [22, 22] },
    { kind: 'oval', nm: 'low-anchor-center', color: pal.metal, c: ANCHOR, s: [8, 8] },
  ] }),
  propsBox: [ANCHOR[0] - 44, X0 + 104],
  dynamic: [bandLine((J) => [ANCHOR, J.ankle_n], 'underNearArm', 'Ankle Band')],
  pose(t) {
    const p = tl.at(t).p;
    const workingAnkle = lerpV([X0, G - A], [HIP[0] + 94, HIP[1] + 90], p);
    return {
      hip: HIP,
      farHip: 0,
      spine: { lumbar: -89, thoracic: -91 },
      neck: -86,
      head: -88,
      legs: {
        // The ankle path gives a straight leg at the floor and a right-angle hip and knee at the top.
        near: { target: workingAnkle, foot: 0, side: [0, -1] },
        far: { target: [X0, G - A], foot: 0, side: [1, 0] },
      },
      arms: {
        near: { a1: lerp(92, 94, p), a2: lerp(86, 91, p), hand: 88 },
        far: { a1: lerp(94, 96, p), a2: lerp(88, 93, p), hand: 90 },
      },
    };
  },
} satisfies SideExercise;
