// Single-leg hack calf raise, side view. The back stays on the hack carriage and the free leg is lifted clear.
// The working forefoot remains at the block edge while one ankle raises and lowers the heel.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, hackMachineProps, machineHandleArms, shoulderPads, standingPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-single-leg-hack-calf-raise',
  name: '哈克机单腿提踵',
  tl: calfTL,
  meta: { en: 'Machine Single-Leg Hack Calf Raise', family: 'calf-raise', equipment: ['machine', 'sled'], sources: ['hz:1384'] },
  muscles: [{ m: 'calves', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.3 }, { m: 'glutes', scale: 0.3 }],
  props: hackMachineProps(),
  propsBox: [150, 390],
  dynamic: [shoulderPads],
  pose: (t) => standingPose(calfTL.at(t).p, machineHandleArms, true),
} satisfies SideExercise;
