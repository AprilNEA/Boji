// Sit on the sliding seat with strapped feet against the footplate.
// Drive with the legs first, then pull the handle to the upper abdomen and recover forward.
import type { SideExercise } from '@/exercise.ts';
import { rowing } from './_cardio-2.ts';

export default {
  ...rowing({ en: 'Rowing Machine Row', sources: ['fe:Rowing_Stationary'] }, '划船机划船'),
  id: 'rowing-machine-row',
} satisfies SideExercise;
