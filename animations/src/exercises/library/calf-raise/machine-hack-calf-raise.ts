// Hack-sled calf raise, side view. The back is supported by the hack carriage while both forefeet hold the block edge.
// The knees remain extended and the heels rise together through ankle plantar flexion only.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, hackMachineProps, machineHandleArms, shoulderPads, standingPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-hack-calf-raise',
  name: '哈克机提踵',
  tl: calfTL,
  meta: { en: 'Machine Hack Calf Raise', family: 'calf-raise', equipment: ['machine', 'sled'], sources: ['hz:1383'] },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.3 }, { m: 'glutes', scale: 0.3 }],
  props: hackMachineProps(),
  propsBox: [150, 390],
  dynamic: [shoulderPads],
  pose: (t) => standingPose(calfTL.at(t).p, machineHandleArms),
} satisfies SideExercise;
