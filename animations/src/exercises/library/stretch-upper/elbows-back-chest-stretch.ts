// Place both hands on the lower back. Draw the elbows back while the chest opens.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'elbows-back-chest-stretch', name: '肘后拉胸部拉伸', en: 'Elbows-Back Chest Stretch', equipment: ['bodyweight'], sources: ['fe:Elbows_Back'],
}, 'elbows-back', [{ m: 'pecs' }, { m: 'delts', side: 'both', scale: 0.4 }]) satisfies FrontExercise;
