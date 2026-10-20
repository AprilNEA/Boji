// Smith reverse calf raise, side view. The heels remain supported on the raised block while the forefeet extend off it.
// The bar only stabilizes the upright body; the toes lift toward the shins and the heels stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, smithArms, smithBar, smithProps, tibialisPose } from './_calf-raise-2.ts';

export default {
  id: 'smith-machine-tibialis-raise',
  name: '史密斯胫骨前肌提脚尖',
  tl: calfTL,
  meta: { en: 'Smith Machine Tibialis Raise', family: 'calf-raise', equipment: ['smith', 'step'], sources: ['fe:Smith_Machine_Reverse_Calf_Raises'] },
  muscles: [{ m: 'calves', side: 'both' }],
  props: smithProps(true),
  propsBox: [208, 328],
  dynamic: [smithBar],
  pose: (t) => tibialisPose(calfTL.at(t).p, smithArms),
} satisfies SideExercise;
