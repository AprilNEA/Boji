// Start against a bar set just below the knees on rack pins, with bands fixed at the rack base.
// Keep the back braced, then extend knees and hips until the bar reaches lockout.
// The pins and band anchors do not move while the bar rises from the prescribed height.
import type { SideExercise } from '@/exercise.ts';
import { barDeadlift, rackBaseBands, rackProps } from './_hinge-1.ts';

export default barDeadlift({
  id: 'barbell-banded-rack-pull', name: '杠铃弹力带架上硬拉', en: 'Barbell Banded Rack Pull',
  sources: ['fe:Rack_Pull_with_Bands'], start: 104, knee: 104,
  equipment: ['barbell', 'band'], props: rackProps(348), propsBox: [110, 380], extra: rackBaseBands(),
}) satisfies SideExercise;
