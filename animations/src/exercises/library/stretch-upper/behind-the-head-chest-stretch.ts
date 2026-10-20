// Stand with interlaced hands behind the head. Open both elbows while the feet stay planted.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'behind-the-head-chest-stretch', name: '抱头开胸拉伸', en: 'Behind-the-Head Chest Stretch', equipment: ['bodyweight'], sources: ['hz:1259'],
}, 'behind-head', [{ m: 'pecs' }, { m: 'delts', side: 'both', scale: 0.45 }]) satisfies FrontExercise;
