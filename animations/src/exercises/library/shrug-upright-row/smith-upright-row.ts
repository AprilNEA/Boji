// Stand tall inside the Smith rails and hold the guided bar slightly wider than shoulder width.
// Pull the bar toward the chin by driving the elbows outward and upward, then lower it on the same rail path.
import type { FrontExercise } from '@/exercise.ts';
import { frontSmithUprightRow } from './_shrug-upright-row.ts';

export default frontSmithUprightRow({
  id: 'smith-upright-row', name: '史密斯直立划船', en: 'Smith Upright Row', sources: ['hz:0775'],
}) satisfies FrontExercise;
