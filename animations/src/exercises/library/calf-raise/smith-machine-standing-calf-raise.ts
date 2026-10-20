// Smith machine calf raise on a step, side view. The Smith bar rests across the upper back and both hands stabilize it.
// Both forefeet stay on the raised block as the heels descend and rise; the knees stay nearly straight.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, smithArms, smithBar, smithProps, standingPose } from './_calf-raise-2.ts';

export default {
  id: 'smith-machine-standing-calf-raise',
  name: '史密斯站姿提踵',
  tl: calfTL,
  meta: { en: 'Smith Machine Standing Calf Raise', family: 'calf-raise', equipment: ['smith', 'step'], sources: ['fe:Smith_Machine_Calf_Raise'] },
  muscles: [{ m: 'calves', side: 'both' }],
  props: smithProps(true),
  propsBox: [208, 328],
  dynamic: [smithBar],
  pose: (t) => standingPose(calfTL.at(t).p, smithArms),
} satisfies SideExercise;
