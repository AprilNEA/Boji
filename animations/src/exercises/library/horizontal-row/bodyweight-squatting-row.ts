// Leaning back from a fixed waist-high handle in a squat. Both hands pull the torso toward the support.
// The feet and support stay fixed during the row.
import type { SideExercise } from '@/exercise.ts';
import { standingBodyRow } from './_horizontal-row-1.ts';

export default standingBodyRow({
  id: 'bodyweight-squatting-row',
  name: '自重蹲姿划船',
  meta: { en: 'Bodyweight Squatting Row', family: 'horizontal-row', equipment: ['bodyweight', 'pull-up-bar'], sources: ['hz:3168'] },
}, { squat: true }) satisfies SideExercise;
