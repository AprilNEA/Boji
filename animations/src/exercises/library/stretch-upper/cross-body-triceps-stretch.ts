// Bring one bent arm across and over the opposite shoulder. The free hand holds the elbow.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'cross-body-triceps-stretch', name: '横臂肱三头肌拉伸', en: 'Cross-Body Triceps Stretch', equipment: ['bodyweight'], sources: ['fe:Tricep_Side_Stretch'],
}, 'cross-triceps', [{ m: 'triceps', side: 'both', region: { view: 'front', part: 'upper', c: [0, 35], s: [11, 29], mirror: true } }, { m: 'delts', side: 'both', scale: 0.35 }]) satisfies FrontExercise;
