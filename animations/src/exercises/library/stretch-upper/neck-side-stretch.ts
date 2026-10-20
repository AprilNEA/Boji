// Stand upright with relaxed shoulders. Tilt one ear toward the shoulder without using the hand.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'neck-side-stretch', name: '颈部侧屈拉伸', en: 'Neck Side Stretch', equipment: ['bodyweight'], sources: ['hz:1403'],
}, 'neck-free', [{ m: 'neck' }, { m: 'traps', scale: 0.35 }]) satisfies FrontExercise;
