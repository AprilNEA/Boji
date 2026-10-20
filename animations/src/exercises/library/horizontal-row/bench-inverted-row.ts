// Lying under a sturdy bench with heels on the ground. Both hands pull the chest toward the bench edge.
// The bench and heels stay fixed while the elbows flex.
import type { SideExercise } from '@/exercise.ts';
import { invertedRow } from './_horizontal-row-1.ts';

export default invertedRow({
  id: 'bench-inverted-row',
  name: '凳下反向划船',
  meta: { en: 'Bench Inverted Row', family: 'horizontal-row', equipment: ['bodyweight', 'bench'], sources: ['hz:2298'] },
}, { bench: true }) satisfies SideExercise;
