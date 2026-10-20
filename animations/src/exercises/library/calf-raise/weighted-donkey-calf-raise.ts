// Supported donkey calf raise, side view. The source specifies a raised forefoot platform and a stable object to hold.
// The torso stays hinged forward, the knees remain straight, and both heels lift together from the platform edge.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, donkeyPose, donkeyProps } from './_calf-raise-2.ts';

export default {
  id: 'weighted-donkey-calf-raise',
  name: '扶架驴式提踵',
  tl: calfTL,
  meta: { en: 'Weighted Donkey Calf Raise', family: 'calf-raise', equipment: ['other', 'step'], sources: ['hz:0833'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'glutes', scale: 0.3 }],
  props: donkeyProps(false),
  propsBox: [244, 386],
  pose: (t) => donkeyPose(calfTL.at(t).p),
} satisfies SideExercise;
