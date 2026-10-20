// Start tall with one dumbbell hanging at the side and the free hand at the waist.
// Flex the trunk to the unloaded side, then return upright without twisting.
// Keep both feet flat and the knees nearly straight.
import type { FrontExercise } from '@/exercise.ts';
import { standingSideBend } from './_core-lateral.ts';

const exercise = standingSideBend({
  id: 'dumbbell-side-bend', name: '哑铃侧屈', en: 'Dumbbell Side Bend', kind: 'dumbbell',
  equipment: ['dumbbell'], sources: ['fe:Dumbbell_Side_Bend', 'hz:0407'],
});
export default exercise satisfies FrontExercise;
