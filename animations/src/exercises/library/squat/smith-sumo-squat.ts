// Set the Smith bar across the upper back with a wide, toes-out stance.
// Descend between the knees while they track over the feet.
// The guided bar moves vertically and both soles stay flat.
import { makeSmithSumo } from './_squat-1.ts';

export default makeSmithSumo({
  id: 'smith-sumo-squat',
  name: '史密斯相扑深蹲',
  en: 'Smith Sumo Squat',
  equipment: ['smith', 'barbell'],
  sources: ['hz:3142'],
}) satisfies import('@/exercise.ts').FrontExercise;
