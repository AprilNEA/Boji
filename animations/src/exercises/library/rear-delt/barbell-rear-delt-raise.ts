// Barbell rear-delt raise, front view. Keep a soft-knee hip hinge and a wide overhand grip on one fixed bar.
// The hands rise from beneath the shoulders to shoulder height with nearly straight, softly unlocked elbows.
// The feet and spine stay fixed; the bar remains level and moves as one rigid implement.
import type { FrontExercise } from '@/exercise.ts';
import { add3 } from '@/math/vec3.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { hingePose, rearDeltMuscles, rearDeltTL, ropeGrip, sideSign } from './_rear-delt-1.ts';

export default {
  id: 'barbell-rear-delt-raise',
  name: '杠铃俯身后束平举',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Barbell Rear Delt Raise', family: 'rear-delt', equipment: ['barbell'], sources: ['hz:0075'] },
  muscles: rearDeltMuscles,
  dynamic: [barbell({ view: 'front', plate: 'small', at: (J) => ({ p: ropeGrip(J) }) })],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return hingePose((side, J) => {
      const s = sideSign(side);
      const start = add3(J[`shoulder_${side}`], [s * 80, -89, 25]);
      const end = add3(J[`shoulder_${side}`], [s * 119, 0, -25]);
      return { target: [start[0] + (end[0] - start[0]) * p, start[1] + (end[1] - start[1]) * p, start[2] + (end[2] - start[2]) * p], pole: [s * 0.7, 0, -1] };
    });
  },
} satisfies FrontExercise;
