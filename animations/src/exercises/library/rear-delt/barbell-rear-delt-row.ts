// Barbell rear-delt row, front view. Use a soft-knee hip hinge and a pronated grip just outside shoulder width.
// The bar begins beneath the chest, then comes toward the upper chest as the elbows flare at shoulder height.
// The trunk and feet stay fixed, and the bar stays level throughout the controlled row.
import type { FrontExercise } from '@/exercise.ts';
import { add3 } from '@/math/vec3.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { hingePose, rearDeltMuscles, rearDeltTL, ropeGrip, sideSign } from './_rear-delt-1.ts';

export default {
  id: 'barbell-rear-delt-row',
  name: '杠铃俯身后束划船',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Barbell Rear Delt Row', family: 'rear-delt', equipment: ['barbell'], sources: ['hz:0076'] },
  muscles: [...rearDeltMuscles, { m: 'biceps', side: 'both', scale: 0.35 }],
  dynamic: [barbell({ view: 'front', plate: 'small', at: (J) => ({ p: ropeGrip(J) }) })],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return hingePose((side, J) => {
      const s = sideSign(side);
      const start = add3(J[`shoulder_${side}`], [s * 50, -80, 80]);
      const end = add3(J[`shoulder_${side}`], [s * 67, 3, 61]);
      return { target: [start[0] + (end[0] - start[0]) * p, start[1] + (end[1] - start[1]) * p, start[2] + (end[2] - start[2]) * p], pole: [s, 0, -1] };
    });
  },
} satisfies FrontExercise;
