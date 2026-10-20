// Smith seated single-leg calf raise, side view. The working forefoot holds a raised block while the other leg stays
// clear. A padded Smith bar bears over the working thigh as the ankle extends and returns.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, seatedPose, smithKneeBar, smithSeatedProps } from './_calf-raise-2.ts';

export default {
  id: 'smith-seated-single-leg-calf-raise',
  name: '史密斯坐姿单腿提踵',
  tl: calfTL,
  meta: { en: 'Smith Seated Single-Leg Calf Raise', family: 'calf-raise', equipment: ['smith', 'step'], sources: ['hz:1395'] },
  muscles: [{ m: 'calves', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.35 }],
  props: smithSeatedProps(),
  propsBox: [100, 356],
  dynamic: [smithKneeBar],
  pose: (t) => seatedPose(calfTL.at(t).p, true),
} satisfies SideExercise;
