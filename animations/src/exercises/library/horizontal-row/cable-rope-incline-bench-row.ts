// Lie chest-down on a 45-degree incline bench facing the low cable station.
// Pull the rope from a forward reach to the upper chest while the bench prevents torso movement.
import type { SideExercise } from '@/exercise.ts';
import { inclineRow } from './_horizontal-row-2.ts';

export default inclineRow({
  id: 'cable-rope-incline-bench-row', name: '上斜凳绳索划船', en: 'Cable Rope Incline-Bench Row',
  equipment: ['cable', 'bench'], sources: ['hz:1322'], cable: true,
}) satisfies SideExercise;
