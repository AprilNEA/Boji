// Stand facing a high pulley with parallel feet, a fixed hip hinge, and a neutral spine.
// Both hands pull the rope on a straight-arm shoulder arc down to the thighs before a controlled return.
import type { SideExercise } from '@/exercise.ts';
import { standingCablePulldown } from './_pullover.ts';

export default standingCablePulldown({
  id: 'cable-rope-standing-straight-arm-pulldown',
  name: '绳索绳把站姿直臂下拉',
  meta: {
    en: 'Cable Rope Standing Straight-Arm Pulldown', family: 'pullover', equipment: ['cable'],
    sources: ['hz:0232'],
  },
  rope: true,
}) satisfies SideExercise;
