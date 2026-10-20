// Start with one foot flat and the rear toes grounded behind the standing body.
// Curl both dumbbells together; the trunk, upper arms, and balance contacts stay still.
import type { SideExercise } from '@/exercise.ts';
import { standingDumbbell } from './_biceps-curl-5.ts';

export default standingDumbbell({
  id: 'dumbbell-stork-stance-biceps-curl', name: '前后支撑哑铃弯举', en: 'Dumbbell Stork-Stance Biceps Curl',
  equipment: ['dumbbell'], sources: ['hz:1653'],
}, { stork: true }) satisfies SideExercise;
