// Lying under a waist-high bar with the knees bent and feet grounded. Both hands pull the chest up.
// The bar and feet stay fixed while the elbows flex.
import type { SideExercise } from '@/exercise.ts';
import { invertedRow } from './_horizontal-row-1.ts';

export default invertedRow({
  id: 'bent-knee-inverted-row',
  name: '屈膝反向划船',
  meta: { en: 'Bent-Knee Inverted Row', family: 'horizontal-row', equipment: ['bodyweight', 'pull-up-bar'], sources: ['hz:2300'] },
}, { bentKnee: true }) satisfies SideExercise;
