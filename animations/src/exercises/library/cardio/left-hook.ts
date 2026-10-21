// Left hook, front view. The boxer starts in a soft-kneed guard with both hands high.
// The left elbow swings level across the body while the hips and chest rotate, then the hand returns to the chin.
import type { FrontExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { add3 } from '@/math/vec3.ts';
import { BODY } from '@/rig/side.ts';
import { cardioTL } from './_cardio-1.ts';

const hook = (t: number): number => (1 - Math.cos(Math.PI * 2 * t)) / 2;

export default {
  id: 'left-hook',
  name: '左勾拳',
  view: 'front',
  tl: cardioTL(1.1),
  meta: { en: 'Left Hook', family: 'cardio', equipment: ['bodyweight'], sources: ['hz:2271'] },
  muscles: [{ m: 'delts', side: 'l' }, { m: 'obliques', scale: 0.55 }, { m: 'triceps', side: 'l', scale: 0.4, region: { view: 'front', part: 'upper', c: [0, 34], s: [12, 29] } }],
  pose(t) {
    const p = hook(t);
    return {
      pelvis: [0, BODY.ankleH + 178, 0], hips: { yaw: 13 * p }, spine: { yaw: 17 * p }, head: { yaw: 4 * p },
      legs: {
        l: { target: [22, BODY.ankleH, 6] },
        r: { target: [-26, BODY.ankleH, 0] },
      },
      arms: {
        // Both hands begin at chin height. The lead elbow then stays level and out from the shoulder while the fist arcs inward.
        l: { target: (J) => add3(J.shoulder_l, [lerp(10, -45, p), lerp(20, 0, p), lerp(78, 80, p)]), pole: [1, 0, 1] },
        r: { target: (J) => add3(J.shoulder_r, [-10, 20, 78]), pole: [-1, 0, 1] },
      },
    };
  },
} satisfies FrontExercise;
