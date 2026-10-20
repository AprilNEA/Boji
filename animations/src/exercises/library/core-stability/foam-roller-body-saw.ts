// Balance in a forearm plank with the toes fixed and both forearms resting on a foam roller.
// Roll the forearms forward to lengthen the body, then pull the roller back under control.
// The torso stays braced so the lower back does not sag as the roller travels.
import type { SideExercise } from '@/exercise.ts';
import { FLOOR } from '@/exercises/common.ts';
import { foamRoller, ROLLER, workTL } from '@/exercises/equipment/index.ts';
import { bodySawPose } from './_core-stability-2.ts';

const tl = workTL(0.45);

export default {
  id: 'foam-roller-body-saw',
  name: '泡沫轴身体锯式平板支撑',
  tl,
  mat: true,
  meta: { en: 'Foam Roller Body Saw', family: 'core-stability', equipment: ['bodyweight', 'foam-roller'], sources: ['hz:2204'] },
  muscles: [
    { m: 'abs' }, { m: 'delts', side: 'both', scale: 0.52 },
    { m: 'triceps', side: 'both', scale: 0.35 },
  ],
  dynamic: [foamRoller((J) => ({ p: [(J.elbow_n[0] + J.wrist_n[0]) / 2, FLOOR - ROLLER.r] }), 'end', 'back')],
  propsBox: [100, 470],
  poster: 0.31,
  pose: (t) => bodySawPose(tl.at(t).p),
} satisfies SideExercise;
