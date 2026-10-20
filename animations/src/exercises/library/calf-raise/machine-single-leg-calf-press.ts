// Single-leg sled calf press, side view. One forefoot holds the sled edge and the other leg stays clear of the plate.
// The working knee remains slightly bent as the working ankle plantar-flexes and returns.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, legPressMachineProps, legPressPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-single-leg-calf-press',
  name: '器械单腿蹬腿提踵',
  tl: calfTL,
  meta: { en: 'Machine Single-Leg Calf Press', family: 'calf-raise', equipment: ['machine', 'sled'], sources: ['hz:1392'] },
  muscles: [{ m: 'calves', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.35 }, { m: 'glutes', scale: 0.3 }],
  props: legPressMachineProps('angled'),
  propsBox: [40, 405],
  pose: (t) => legPressPose(calfTL.at(t).p, true),
} satisfies SideExercise;
