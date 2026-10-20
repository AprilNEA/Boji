// Wide-grip barbell rear-delt row, front view. Hinge until the torso is nearly parallel and grip the bar well outside the shoulders.
// The arms hang first, then the elbows travel wide and high as the bar approaches the upper chest.
// The back angle, planted feet and level bar remain fixed during the repetition.
import type { FrontExercise } from '@/exercise.ts';
import { add3 } from '@/math3.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { hingePose, rearDeltMuscles, rearDeltTL, ropeGrip, sideSign } from './_rear-delt-1.ts';

export default {
  id: 'barbell-wide-grip-rear-delt-row',
  name: '杠铃宽握肩后束划船',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Barbell Wide-Grip Rear Delt Row', family: 'rear-delt', equipment: ['barbell'], sources: ['fe:Barbell_Rear_Delt_Row'] },
  muscles: [...rearDeltMuscles, { m: 'biceps', side: 'both', scale: 0.3 }],
  dynamic: [barbell({ view: 'front', plate: 'small', at: (J) => ({ p: ropeGrip(J) }) })],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return hingePose((side, J) => {
      const s = sideSign(side);
      const start = add3(J[`shoulder_${side}`], [s * 67, -76, 75]);
      const end = add3(J[`shoulder_${side}`], [s * 78, 1, 49]);
      return { target: [start[0] + (end[0] - start[0]) * p, start[1] + (end[1] - start[1]) * p, start[2] + (end[2] - start[2]) * p], pole: [s, 0, -1] };
    });
  },
} satisfies FrontExercise;
