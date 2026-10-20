// Extend crossed hands straight in front at shoulder height. Press the palms forward as the shoulder blades draw together.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'chest-and-anterior-shoulder-stretch', name: '胸肩前侧拉伸', en: 'Chest and Anterior Shoulder Stretch', equipment: ['bodyweight'], sources: ['hz:1271'],
}, 'chest-front', [{ m: 'pecs' }, { m: 'delts', side: 'both', scale: 0.5 }]) satisfies SideExercise;
