// Lever machine calf press, side view. The seated torso stays braced at the pad and the hands hold the side grips.
// The knees stay fixed while both forefeet press the lower plate and the heels cycle through ankle extension.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, seatedMachineProps, seatedPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-calf-press',
  name: '器械蹬式提踵',
  tl: calfTL,
  meta: { en: 'Machine Calf Press', family: 'calf-raise', equipment: ['machine'], sources: ['hz:2289'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
  props: seatedMachineProps(true),
  propsBox: [76, 362],
  pose: (t) => seatedPose(calfTL.at(t).p),
} satisfies SideExercise;
