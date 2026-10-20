// Sit at the chair edge and grip its back. Straighten the arms as the chest moves forward.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'chair-seated-chest-and-shoulder-stretch', name: '坐椅胸肩拉伸', en: 'Chair Seated Chest and Shoulder Stretch', equipment: ['chair'], sources: ['fe:Chair_Upper_Body_Stretch'],
}, 'chair-chest', [{ m: 'pecs' }, { m: 'biceps', side: 'both', scale: 0.35 }, { m: 'delts', side: 'both', scale: 0.35 }]) satisfies SideExercise;
