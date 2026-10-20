// Seated calf press, side view. The thighs are retained under the lever pad and the hands steady the side handles.
// Both knees stay slightly bent while the forefeet drive the platform through plantar flexion.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, seatedMachineProps, seatedPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-seated-calf-press',
  name: '器械坐姿蹬式提踵',
  tl: calfTL,
  meta: { en: 'Machine Seated Calf Press', family: 'calf-raise', equipment: ['machine'], sources: ['fe:Calf_Press', 'hz:2335'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
  props: seatedMachineProps(true),
  propsBox: [76, 362],
  pose: (t) => seatedPose(calfTL.at(t).p),
} satisfies SideExercise;
