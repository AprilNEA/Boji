// Clasp the hands behind the back. Straighten both elbows and lift the hands gently.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'bodyweight-standing-biceps-stretch', name: '站姿肱二头肌拉伸', en: 'Bodyweight Standing Biceps Stretch', equipment: ['bodyweight'], sources: ['fe:Standing_Biceps_Stretch'],
}, 'biceps', [{ m: 'biceps', side: 'both' }, { m: 'pecs', scale: 0.4 }, { m: 'delts', side: 'both', scale: 0.35 }]) satisfies SideExercise;
