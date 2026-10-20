// Brace the chest on an incline bench with both neutral-grip dumbbells hanging straight down.
// Row the weights to the sides of the torso, pause, and return without lifting the chest.
import type { SideExercise } from '@/exercise.ts';
import { inclineRow } from './_horizontal-row-2.ts';

export default inclineRow({
  id: 'dumbbell-neutral-grip-incline-chest-supported-row', name: '上斜凳胸托对握哑铃划船', en: 'Dumbbell Neutral-Grip Incline Chest-Supported Row',
  equipment: ['dumbbell', 'bench'], sources: ['fe:Dumbbell_Incline_Row'], weight: 'dumbbell',
}) satisfies SideExercise;
