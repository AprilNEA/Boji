// Stand with one dumbbell at each side and a neutral hand position.
// Move both shoulders vertically toward the ears while the elbows stay nearly straight.
import type { FrontExercise } from '@/exercise.ts';
import { frontShrug } from './_shrug-upright-row.ts';

export default frontShrug({
  id: 'dumbbell-shrug', name: '哑铃耸肩', en: 'Dumbbell Shrug',
  equipment: ['dumbbell'], sources: ['fe:Dumbbell_Shrug', 'hz:0406'], implement: 'dumbbell',
}) satisfies FrontExercise;
