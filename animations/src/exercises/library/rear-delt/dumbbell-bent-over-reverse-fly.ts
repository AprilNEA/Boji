// Dumbbell bent-over reverse fly, front view. Keep a soft-knee hip hinge with both dumbbells hanging below the shoulders.
// Sweep the softly bent arms out to shoulder height, pause with the shoulder blades retracted, then lower slowly.
// The feet remain planted and the trunk angle does not change while the dumbbells follow the hands.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbell } from '@/exercises/equipment/index.ts';
import { flyArm, hingePose, rearDeltMuscles, rearDeltTL } from './_rear-delt-1.ts';

export default {
  id: 'dumbbell-bent-over-reverse-fly',
  name: '哑铃俯身反向飞鸟',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Dumbbell Bent-Over Reverse Fly', family: 'rear-delt', equipment: ['dumbbell'], sources: ['hz:2292', 'hz:0378', 'hz:0380', 'hz:0383', 'hz:0844'] },
  muscles: rearDeltMuscles,
  dynamic: [frontDumbbell('l', 'end'), frontDumbbell('r', 'end')],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return hingePose((side, J) => flyArm(p, side, J, true));
  },
} satisfies FrontExercise;
