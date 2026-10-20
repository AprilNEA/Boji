// Lie on a 45-degree incline bench with the feet held at the upper end.
// Curl the trunk away from the pad and rotate one shoulder toward the opposite knee.
// Lower slowly back to the pad, then repeat to the other side.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp, lerpV, mul } from '@/math.ts';
import { declineBench } from '@/exercises/equipment/index.ts';
import { alternatingTL, alternate } from './_core-rotation-1.ts';

const BENCH = declineBench({ x: 105, angle: 20, low: 70, length: 235, facing: 1 });
// Hips stay on the elevated half of the pad while the ankles remain under its roller.
const HIP = add(lerpV(BENCH.head, BENCH.foot, 0.64), mul(BENCH.normal, 16));
export default {
  id: 'decline-twisting-sit-up', name: '下斜转体仰卧起坐', tl: alternatingTL, mat: false, poster: 0.14,
  meta: { en: 'Decline Twisting Sit-Up', family: 'core-rotation', equipment: ['bench'], sources: ['hz:0495'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.85 }, { m: 'hipFlexor', side: 'both', scale: 0.3 }],
  props: (pal) => ({ back: BENCH.draw(pal) }), propsBox: BENCH.box,
  pose(t) {
    const { p, near } = alternate(t);
    const turn = (near ? 1 : -1) * 16 * p;
    // The torso starts along the declining pad and curls up toward vertical.
    const trunk = lerp(160, 270, p) + turn;
    return {
      hip: HIP, spine: { lumbar: trunk + 1, thoracic: trunk - 1 }, neck: trunk - 2, head: trunk - 2,
      legs: {
        near: { target: BENCH.roller, foot: -20, side: [0, -1] },
        far: { target: add(BENCH.roller, [-5, 0]), foot: -20, side: [0, -1] },
      },
      arms: {
        near: { a1: -157 + turn, a2: -102 + turn, hand: -104 + turn },
        far: { a1: -155 + turn, a2: -100 + turn, hand: -102 + turn },
      },
    };
  },
} satisfies SideExercise;
