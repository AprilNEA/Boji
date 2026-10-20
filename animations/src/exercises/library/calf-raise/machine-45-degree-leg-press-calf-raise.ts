// 45-degree leg-press calf raise, side view. The torso stays supported on the reclined pad and the knees remain almost
// straight. Both forefeet press the sled platform by plantar-flexing at the ankles only.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, legPressMachineProps, legPressPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-45-degree-leg-press-calf-raise',
  name: '四十五度腿举提踵',
  tl: calfTL,
  meta: { en: 'Machine 45-Degree Leg Press Calf Raise', family: 'calf-raise', equipment: ['machine', 'sled'], sources: ['hz:0738'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
  props: legPressMachineProps('angled'),
  propsBox: [40, 405],
  pose: (t) => legPressPose(calfTL.at(t).p),
} satisfies SideExercise;
