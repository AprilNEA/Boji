// Dumbbell wall stability-ball calf raise, side view. The lower back rests against a ball held to the wall, while
// both arms hang with dumbbells. The heels rise together over the balls of the feet; knees stay nearly straight.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, dumbbellDynamics, standingPose, wallBallDynamic, wallBallProps } from './_calf-raise-2.ts';

export default {
  id: 'dumbbell-wall-stability-ball-calf-raise',
  name: '哑铃靠墙健身球提踵',
  tl: calfTL,
  meta: {
    en: 'Dumbbell Wall Stability Ball Calf Raise', family: 'calf-raise',
    equipment: ['dumbbell', 'stability-ball', 'wall'], sources: ['hz:1382'],
  },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'quads', side: 'both', scale: 0.3 }],
  props: () => wallBallProps(),
  dynamic: [...wallBallDynamic, ...dumbbellDynamics],
  pose: (t) => standingPose(calfTL.at(t).p),
} satisfies SideExercise;
