// Stand tall with the Smith bar held behind the thighs in a shoulder-width overhand grip.
// Keep both elbows straight as the shoulders lift vertically, then lower without torso movement.
import type { FrontExercise } from '@/exercise.ts';
import { frontSmithShrug } from './_shrug-upright-row.ts';

export default frontSmithShrug({
  id: 'smith-machine-behind-the-back-shrug', name: '史密斯背后耸肩', en: 'Smith Machine Behind-the-Back Shrug',
  sources: ['fe:Smith_Machine_Behind_the_Back_Shrug'], behind: true,
}) satisfies FrontExercise;
