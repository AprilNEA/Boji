// Stand tall with the Smith bar behind the thighs and keep the elbows locked.
// Elevate the shoulders straight toward the ears, pause briefly, and lower the bar smoothly.
import type { FrontExercise } from '@/exercise.ts';
import { frontSmithShrug } from './_shrug-upright-row.ts';

export default frontSmithShrug({
  id: 'smith-behind-the-back-shrug', name: '史密斯背后耸肩', en: 'Smith Behind-the-Back Shrug',
  sources: ['hz:0746'], behind: true,
}) satisfies FrontExercise;
