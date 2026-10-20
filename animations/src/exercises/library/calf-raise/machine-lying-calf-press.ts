// Lying sled calf press, side view. The body is reclined against the sled back pad and the knees stay nearly straight.
// Both forefeet hold the platform edge while plantar flexion presses it away, then dorsiflexion returns it.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, legPressMachineProps, legPressPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-lying-calf-press',
  name: '仰卧蹬腿提踵',
  tl: calfTL,
  meta: { en: 'Machine Lying Calf Press', family: 'calf-raise', equipment: ['machine', 'sled'], sources: ['hz:2334'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'glutes', scale: 0.3 }],
  props: legPressMachineProps('lying'),
  propsBox: [40, 405],
  pose: (t) => legPressPose(calfTL.at(t).p),
} satisfies SideExercise;
