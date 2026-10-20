// Stand inside the Smith rails with the bar at the upper thighs and the elbows nearly straight.
// Shrug vertically toward the ears, then lower without bending the arms or changing the torso.
import type { FrontExercise } from '@/exercise.ts';
import { frontSmithShrug } from './_shrug-upright-row.ts';

export default frontSmithShrug({
  id: 'smith-shrug', name: '史密斯耸肩', en: 'Smith Shrug', sources: ['hz:0767'],
}) satisfies FrontExercise;
