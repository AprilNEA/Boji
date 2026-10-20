// Stand back from a high pulley in a staggered stance with the torso hinged forward.
// Straight arms pull the rope to the thighs while the pelvis and spine remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { standingCablePulldown } from './_pullover.ts';

export default standingCablePulldown({
  id: 'cable-rope-straight-arm-pulldown',
  name: '绳索直臂下拉',
  meta: {
    en: 'Cable Rope Straight-Arm Pulldown', family: 'pullover', equipment: ['cable'],
    sources: ['fe:Rope_Straight-Arm_Pulldown', 'hz:0237'],
  },
  rope: true,
  staggered: true,
}) satisfies SideExercise;
