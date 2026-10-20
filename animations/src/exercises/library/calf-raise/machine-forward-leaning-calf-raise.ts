// Forward-leaning machine calf raise, side view. The hands stay on the forward handles and the body remains inclined.
// Both forefeet stay on the platform edge as the ankles extend and return; the knees do not bend.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, donkeyPose, donkeyProps } from './_calf-raise-2.ts';

export default {
  id: 'machine-forward-leaning-calf-raise',
  name: '器械前倾提踵',
  tl: calfTL,
  meta: { en: 'Machine Forward-Leaning Calf Raise', family: 'calf-raise', equipment: ['machine', 'step'], sources: ['hz:0742'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'glutes', scale: 0.3 }],
  props: donkeyProps(false),
  propsBox: [244, 386],
  pose: (t) => donkeyPose(calfTL.at(t).p),
} satisfies SideExercise;
