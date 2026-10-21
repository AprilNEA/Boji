// 卷腹 (crunch). Lying on the back with bent knees: the upper back curls up while the lower back stays on the mat. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { add, ang, dir, lerp, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { A, FLOOR } from '@/exercises/common.ts';

const crunchTL = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.3, 1] },
  { d: 0.5, from: 1, to: 1, e: [1, 0.95] },
  { d: 1.4, from: 1, to: 0, e: [0.8, 0.3] },
  { d: 0.6, from: 0, to: 0, e: [0.25, 0.2] },
]);

// Same floor contact as the glute bridge at rest: neck base and hips on the mat.
const NECK: Vec2 = [150, FLOOR - 18];
const HIP = add(NECK, mul(dir(-3.8), 123.7));
/** Spine direction from the hips to the neck base when lying flat. */
const FLAT = ang(sub(NECK, HIP));
const ANKLE: Vec2 = [HIP[0] + 106, FLOOR - A];
/** Upper-back curl at the top, in degrees. About 30° lifts the shoulder blades off the mat. */
const CURL = 31;

const crunch = {
  id: 'crunch', name: '卷腹', tl: crunchTL, mat: true,
  meta: { en: 'Crunch', family: 'core-flexion', equipment: ['bodyweight', 'mat'], sources: ['fe:Crunches', 'hz:0274', 'hz:3016'] },
  muscles: [{ m: 'abs' }],
  pose(t) {
    const { p } = crunchTL.at(t);
    return {
      hip: HIP,
      spine: { lumbar: FLAT - 1, thoracic: FLAT + CURL * p },
      neck: lerp(182, 222, p), head: lerp(181, 225, p),
      legs: {
        near: { target: ANKLE, foot: 0, side: [0, -1] },
        far: { target: add(ANKLE, [-5, 0]), foot: 0, side: [0, -1] },
      },
      // Arms rest on the mat, then reach toward the knees.
      arms: {
        near: { a1: lerp(8, -14, p), a2: lerp(1, -16, p), hand: lerp(0, -16, p) },
        far: { a1: lerp(7, -15, p), a2: lerp(0, -17, p), hand: lerp(0, -17, p) },
      },
    };
  },
} satisfies Exercise;

export default crunch;
