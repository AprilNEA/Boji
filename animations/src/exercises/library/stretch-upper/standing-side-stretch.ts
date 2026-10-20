// Keep both arms extended sideways at shoulder height. Bend the trunk laterally without rotating.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'standing-side-stretch', name: '站姿侧屈拉伸', en: 'Standing Side Stretch', equipment: ['bodyweight'], sources: ['hz:0794'],
}, 'standing-side', [{ m: 'lats', side: 'both' }, { m: 'obliques', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.3 }]) satisfies FrontExercise;
