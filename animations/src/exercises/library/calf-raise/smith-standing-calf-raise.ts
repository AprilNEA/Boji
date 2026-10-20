// Smith standing calf raise, side view. The bar rests across the shoulders and both hands keep it stable on its rails.
// The feet start flat on the floor, then both heels rise over the balls of the feet with nearly straight knees.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, smithArms, smithBar, smithProps, standingPose } from './_calf-raise-2.ts';

export default {
  id: 'smith-standing-calf-raise',
  name: '史密斯站姿提踵',
  tl: calfTL,
  meta: { en: 'Smith Standing Calf Raise', family: 'calf-raise', equipment: ['smith'], sources: ['hz:0773'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'glutes', scale: 0.3 }],
  props: smithProps(false),
  propsBox: [208, 328],
  dynamic: [smithBar],
  pose: (t) => standingPose(calfTL.at(t).p, smithArms),
} satisfies SideExercise;
