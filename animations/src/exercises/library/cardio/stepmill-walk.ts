// Face the revolving stairs with an upright trunk and hands on the rails.
// Place one foot then the other onto successive steps in a controlled walking rhythm.
import type { SideExercise } from '@/exercise.ts';
import { stepper } from './_cardio-2.ts';

export default {
  ...stepper({ en: 'Stepmill Walk', sources: ['hz:2311'] }, '阶梯机爬楼', true),
  id: 'stepmill-walk',
} satisfies SideExercise;
