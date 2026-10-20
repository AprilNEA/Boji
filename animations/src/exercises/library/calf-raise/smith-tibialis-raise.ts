// Smith tibialis raise, side view. The heels stay on the raised block while the hands stabilize the bar.
// Both toes lift toward the shins and lower with control; the knees remain nearly straight.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, smithArms, smithBar, smithProps, tibialisPose } from './_calf-raise-2.ts';

export default {
  id: 'smith-tibialis-raise',
  name: '史密斯反向提踵',
  tl: calfTL,
  meta: { en: 'Smith Tibialis Raise', family: 'calf-raise', equipment: ['smith', 'step'], sources: ['hz:0763', 'hz:1394'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
  props: smithProps(true),
  propsBox: [208, 328],
  dynamic: [smithBar],
  pose: (t) => tibialisPose(calfTL.at(t).p, smithArms),
} satisfies SideExercise;
