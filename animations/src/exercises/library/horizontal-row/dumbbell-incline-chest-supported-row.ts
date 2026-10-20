// Keep the chest against a 45-degree incline pad and the feet grounded behind it.
// Let both dumbbells hang below the shoulders, then row the elbows behind the torso.
import type { SideExercise } from '@/exercise.ts';
import { inclineRow } from './_horizontal-row-2.ts';

export default inclineRow({
  id: 'dumbbell-incline-chest-supported-row', name: '上斜凳胸托哑铃划船', en: 'Dumbbell Incline Chest-Supported Row',
  equipment: ['dumbbell', 'bench'], sources: ['hz:0327'], weight: 'dumbbell',
}) satisfies SideExercise;
