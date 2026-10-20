// Machine donkey calf raise, side view. The hips rest under the padded lever and both hands stay on the fixed handles.
// The balls of both feet remain on the calf block while the straight knees stay fixed and the heels rise.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, donkeyPose, donkeyProps } from './_calf-raise-2.ts';

export default {
  id: 'machine-donkey-calf-raise',
  name: '器械驴式提踵',
  tl: calfTL,
  meta: { en: 'Machine Donkey Calf Raise', family: 'calf-raise', equipment: ['machine', 'step'], sources: ['fe:Donkey_Calf_Raises', 'hz:1253'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'glutes', scale: 0.3 }],
  props: donkeyProps(true),
  propsBox: [126, 386],
  pose: (t) => donkeyPose(calfTL.at(t).p),
} satisfies SideExercise;
