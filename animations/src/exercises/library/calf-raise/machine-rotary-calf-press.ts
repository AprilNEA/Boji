// Rotary calf press, side view. The person sits upright with the knees held at one angle and the feet on the rotating
// forefoot plate. The ankles plantar-flex to press the plate, then return without knee motion.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, seatedMachineProps, seatedPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-rotary-calf-press',
  name: '旋转式提踵',
  tl: calfTL,
  meta: { en: 'Machine Rotary Calf Press', family: 'calf-raise', equipment: ['machine'], sources: ['hz:2315'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.3 }],
  props: seatedMachineProps(false),
  propsBox: [76, 362],
  pose: (t) => seatedPose(calfTL.at(t).p),
} satisfies SideExercise;
