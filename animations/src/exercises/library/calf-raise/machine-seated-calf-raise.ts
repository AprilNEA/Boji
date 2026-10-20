// Seated calf raise, side view. The lower thighs remain under the lever pad and both balls of the feet stay on the
// platform edge. The heels lower for the stretch, then rise as the ankles extend without knee movement.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, seatedMachineProps, seatedPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-seated-calf-raise',
  name: '器械坐姿提踵',
  tl: calfTL,
  meta: { en: 'Machine Seated Calf Raise', family: 'calf-raise', equipment: ['machine'], sources: ['fe:Seated_Calf_Raise', 'hz:0594'] },
  muscles: [{ m: 'calves', side: 'both' }],
  props: seatedMachineProps(true),
  propsBox: [76, 362],
  pose: (t) => seatedPose(calfTL.at(t).p),
} satisfies SideExercise;
