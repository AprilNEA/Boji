// Stand tall with the bar in front of the upper thighs and the elbows almost fully straight.
// Elevate both shoulders toward the ears, then lower the bar vertically without curling or torso motion.
import type { FrontExercise } from '@/exercise.ts';
import { frontShrug } from './_shrug-upright-row.ts';

export default frontShrug({
  id: 'barbell-shrug', name: '杠铃耸肩', en: 'Barbell Shrug',
  equipment: ['barbell'], sources: ['fe:Barbell_Shrug', 'hz:0095'], implement: 'barbell',
}) satisfies FrontExercise;
