// Smith standing calf raise on a step, side view. The bar is on the upper back and both forefeet stay on the block.
// The heels travel down from the block edge and then rise high over the forefeet while the knees remain nearly straight.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, smithArms, smithBar, smithProps, standingPose } from './_calf-raise-2.ts';

export default {
  id: 'smith-standing-calf-raise-on-step',
  name: '史密斯台阶站姿提踵',
  tl: calfTL,
  meta: { en: 'Smith Standing Calf Raise on Step', family: 'calf-raise', equipment: ['smith', 'step'], sources: ['hz:1396'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'glutes', scale: 0.3 }],
  props: smithProps(true),
  propsBox: [208, 328],
  dynamic: [smithBar],
  pose: (t) => standingPose(calfTL.at(t).p, smithArms),
} satisfies SideExercise;
