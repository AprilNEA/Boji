// Standing calf machine raise, side view. The shoulders stay under the carriage pads and the hands hold the handles.
// Both forefeet remain on the calf block while the heels rise together; the knees keep a small unlocked bend.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, machineHandleArms, shoulderPads, standingMachineProps, standingPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-standing-calf-raise',
  name: '器械站姿提踵',
  tl: calfTL,
  meta: { en: 'Machine Standing Calf Raise', family: 'calf-raise', equipment: ['machine', 'step'], sources: ['fe:Standing_Calf_Raises', 'hz:0605'] },
  muscles: [{ m: 'calves', side: 'both' }],
  props: standingMachineProps(),
  propsBox: [156, 378],
  dynamic: [shoulderPads],
  pose: (t) => standingPose(calfTL.at(t).p, machineHandleArms),
} satisfies SideExercise;
