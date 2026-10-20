// Step back from a high pulley with a 30° hip hinge and a wide straight-bar grip.
// The elbows stay softly bent while the shoulders pull the bar from overhead to the thighs.
import type { SideExercise } from '@/exercise.ts';
import { standingCablePulldown } from './_pullover.ts';

export default standingCablePulldown({
  id: 'cable-wide-grip-straight-arm-pulldown',
  name: '绳索宽握直臂下拉',
  meta: {
    en: 'Cable Wide-Grip Straight-Arm Pulldown', family: 'pullover', equipment: ['cable'],
    sources: ['fe:Straight-Arm_Pulldown'],
  },
  rope: false,
  wide: true,
}) satisfies SideExercise;
