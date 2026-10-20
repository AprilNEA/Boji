// Keep the shoulders relaxed and level. A hand adds a light pull as the head tilts sideways.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'lateral-neck-stretch', name: '侧屈颈部拉伸', en: 'Lateral Neck Stretch', equipment: ['bodyweight'], sources: ['fe:Side_Neck_Stretch'],
}, 'neck-assisted', [{ m: 'neck' }, { m: 'traps', scale: 0.35 }]) satisfies FrontExercise;
