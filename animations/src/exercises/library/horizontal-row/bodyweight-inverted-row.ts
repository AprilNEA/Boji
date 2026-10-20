// Lying under a waist-high bar with heels on the ground. Both hands pull the chest toward the bar.
// The bar and heels stay fixed while the body stays straight.
import type { SideExercise } from '@/exercise.ts';
import { invertedRow } from './_horizontal-row-1.ts';

export default invertedRow({
  id: 'bodyweight-inverted-row',
  name: '自重反向划船',
  meta: { en: 'Bodyweight Inverted Row', family: 'horizontal-row', equipment: ['bodyweight', 'pull-up-bar'], sources: ['hz:3019'] },
}, {}) satisfies SideExercise;
