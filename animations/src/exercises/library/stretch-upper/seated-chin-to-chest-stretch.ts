// Sit on the floor with fingers interlaced behind the head. Draw the chin slowly toward the chest.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'seated-chin-to-chest-stretch', name: '坐姿低头拉伸', en: 'Seated Chin-to-Chest Stretch', equipment: ['bodyweight', 'mat'], sources: ['fe:Chin_To_Chest_Stretch'],
}, 'chin-chest', [{ m: 'neck' }, { m: 'traps', scale: 0.4 }]) satisfies SideExercise;
