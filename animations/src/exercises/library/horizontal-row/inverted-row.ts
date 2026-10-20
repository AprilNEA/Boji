// Hanging beneath a waist-high bar with heels on the floor. Both hands pull the chest toward the bar.
// The bar and heels stay fixed while the body stays in one line.
import type { SideExercise } from '@/exercise.ts';
import { invertedRow } from './_horizontal-row-1.ts';

export default invertedRow({
  id: 'inverted-row',
  name: '反向划船',
  meta: { en: 'Inverted Row', family: 'horizontal-row', equipment: ['bodyweight', 'pull-up-bar'], sources: ['fe:Inverted_Row', 'hz:0499', 'hz:0497'] },
}, {}) satisfies SideExercise;
