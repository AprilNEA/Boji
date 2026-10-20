// Keep the chest against a 45-degree backrest with the feet flat on the ground.
// Row both underhand dumbbells from a vertical hang toward the chest without moving the torso.
import type { SideExercise } from '@/exercise.ts';
import { inclineRow } from './_horizontal-row-2.ts';

export default inclineRow({
  id: 'dumbbell-reverse-grip-incline-chest-supported-row', name: '上斜凳反握胸托哑铃划船', en: 'Dumbbell Reverse-Grip Incline Chest-Supported Row',
  equipment: ['dumbbell', 'bench'], sources: ['hz:1331'], weight: 'dumbbell', reverse: true,
}) satisfies SideExercise;
