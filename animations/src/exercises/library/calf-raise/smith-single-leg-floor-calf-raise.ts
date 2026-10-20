// Single-leg Smith lower-leg calf raise, side view. The working forefoot is on a raised block and the free leg is clear.
// The Smith bar bears just above the working ankle while that heel rises and lowers through the ankle.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, smithAnkleBar, smithProps, standingPose } from './_calf-raise-2.ts';

export default {
  id: 'smith-single-leg-floor-calf-raise',
  name: '史密斯单腿提踵',
  tl: calfTL,
  meta: { en: 'Smith Single-Leg Floor Calf Raise', family: 'calf-raise', equipment: ['smith', 'step'], sources: ['hz:1393'] },
  muscles: [{ m: 'calves', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.35 }, { m: 'glutes', scale: 0.3 }],
  props: smithProps(true),
  propsBox: [208, 328],
  dynamic: [smithAnkleBar],
  pose: (t) => standingPose(calfTL.at(t).p, undefined, true),
} satisfies SideExercise;
