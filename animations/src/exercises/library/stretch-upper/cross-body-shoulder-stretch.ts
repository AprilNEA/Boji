// Keep one arm long across the chest. The other arm supports the elbow without lifting the shoulder.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'cross-body-shoulder-stretch', name: '交叉抱臂肩部拉伸', en: 'Cross-Body Shoulder Stretch', equipment: ['bodyweight'], sources: ['fe:Shoulder_Stretch', 'hz:0669'],
}, 'cross-shoulder', [{ m: 'delts', side: 'both' }]) satisfies FrontExercise;
