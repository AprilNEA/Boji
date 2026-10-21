// Start supine with the arms spread on the mat and both straight legs above the hips.
// Lower the long legs together to one side, hold, return upright, then repeat to the other side.
// The shoulders, arms and head remain grounded; each foot finishes with its toe on the mat.
import type { FrontExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { add3, rotAxis, type Vec3 } from '@/math/vec3.ts';
import { toeDir, type FSide, type FrontJoints } from '@/rig/front.ts';
import { BODY } from '@/rig/side.ts';

const pelvisY = 26;
const ankleY = BODY.ankleH;
const hips: Record<FSide, Vec3> = { l: [17, pelvisY, 0], r: [-17, pelvisY, 0] };
const legReach = 183;
const lowerAngle = 94;

const ironCrossTL = timeline([
  { d: 1.7, from: 0, to: 1, e: [0.25, 0.85] },
  { d: 3.2, from: 1, to: 1, e: [0.85, 0.8] },
  { d: 1.7, from: 1, to: 0, e: [0.75, 0.3] },
  { d: 1.7, from: 0, to: -1, e: [0.3, 0.85] },
  { d: 3.2, from: -1, to: -1, e: [0.85, 0.8] },
  { d: 1.7, from: -1, to: 0, e: [0.75, 0.2] },
  { d: 0.4, from: 0, to: 0, e: [0.2, 0.2] },
]);

function legTarget(side: FSide, p: number): Vec3 {
  const angle = p >= 0 ? lerp(0, -lowerAngle, p) : lerp(0, lowerAngle, -p);
  return add3(hips[side], rotAxis([0, legReach, 0], [0, 0, 1], angle));
}

function handTarget(side: FSide): (J: FrontJoints) => Vec3 {
  return (J) => add3(J[`shoulder_${side}`], [side === 'l' ? 123 : -123, -10, 0]);
}

export default {
  id: 'iron-cross-stretch', name: '仰卧十字转体拉伸', view: 'front', tl: ironCrossTL, mat: true,
  meta: { en: 'Iron Cross Stretch', family: 'stretch-spine', equipment: ['bodyweight', 'mat'], sources: ['hz:1419'] },
  muscles: [{ m: 'glutes', region: { view: 'front', part: 'pelvis', c: [0, 1], s: [44, 27], mirror: false } }, { m: 'hamstrings', side: 'both', scale: 0.5, region: { view: 'front', part: 'thigh', c: [0, 54], s: [20, 54] } }, { m: 'obliques', scale: 0.35 }],
  poster: 0.25,
  pose(t) {
    const p = ironCrossTL.at(t).p;
    return {
      pelvis: [0, pelvisY, 0], hips: { pitch: -90 },
      legs: {
        l: { target: legTarget('l', p), pole: [0, 0, 1], dir: toeDir([0, 0, 1]) },
        r: { target: legTarget('r', p), pole: [0, 0, 1], dir: toeDir([0, 0, 1]) },
      },
      arms: {
        l: { target: handTarget('l'), pole: [0, 0, 1], dir: [1, 0, 0] },
        r: { target: handTarget('r'), pole: [0, 0, 1], dir: [-1, 0, 0] },
      },
    };
  },
} satisfies FrontExercise;
