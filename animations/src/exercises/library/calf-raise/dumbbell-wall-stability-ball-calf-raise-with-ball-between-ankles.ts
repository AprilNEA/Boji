// Dumbbell wall stability-ball calf raise with an ankle ball, side view. The lower back stays against the wall ball
// and a small ball remains squeezed between the ankles. Both heels rise over the forefeet without knee motion.
import type { SideExercise } from '@/exercise.ts';
import { ankleBall, calfTL, dumbbellDynamics, standingPose, wallBallDynamic, wallBallProps } from './_calf-raise-2.ts';

export default {
  id: 'dumbbell-wall-stability-ball-calf-raise-with-ball-between-ankles',
  name: '哑铃靠墙健身球夹球提踵',
  tl: calfTL,
  meta: {
    en: 'Dumbbell Wall Stability Ball Calf Raise with Ball Between Ankles', family: 'calf-raise',
    equipment: ['dumbbell', 'stability-ball', 'wall', 'other'], sources: ['hz:3241'],
  },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'quads', side: 'both', scale: 0.3 }],
  props: () => wallBallProps(),
  dynamic: [...wallBallDynamic, ...dumbbellDynamics, ankleBall],
  pose: (t) => standingPose(calfTL.at(t).p),
} satisfies SideExercise;
