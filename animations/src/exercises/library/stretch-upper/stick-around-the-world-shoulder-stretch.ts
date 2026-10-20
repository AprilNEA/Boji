// Use a wide overhand grip behind the hips. Lift the stick overhead without forcing the range.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'stick-around-the-world-shoulder-stretch', name: '木棍绕肩拉伸', en: 'Stick Around-the-World Shoulder Stretch', equipment: ['other'], sources: ['fe:Round_The_World_Shoulder_Stretch'],
}, 'stick', [{ m: 'delts', side: 'both' }, { m: 'pecs', scale: 0.45 }, { m: 'biceps', side: 'both', scale: 0.3 }]) satisfies FrontExercise;
