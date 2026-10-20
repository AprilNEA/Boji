// Hold the crossed wrist at hip level first. Straighten and lift it toward shoulder height.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'cross-body-wrist-pull-shoulder-stretch', name: '跨体拉腕肩背拉伸', en: 'Cross-Body Wrist-Pull Shoulder Stretch', equipment: ['bodyweight'], sources: ['fe:Side_Wrist_Pull'],
}, 'wrist-pull', [{ m: 'lats', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.3 }]) satisfies FrontExercise;
