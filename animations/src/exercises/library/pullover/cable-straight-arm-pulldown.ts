// Stand facing the high pulley with soft knees, a fixed hip hinge, and the core braced.
// The straight bar stays in nearly straight arms as it travels from overhead to the upper thighs.
import type { SideExercise } from '@/exercise.ts';
import { standingCablePulldown } from './_pullover.ts';

export default standingCablePulldown({
  id: 'cable-straight-arm-pulldown',
  name: '绳索直臂下拉',
  meta: {
    en: 'Cable Straight-Arm Pulldown', family: 'pullover', equipment: ['cable'],
    sources: ['hz:0199', 'hz:0238'],
  },
  rope: false,
}) satisfies SideExercise;
