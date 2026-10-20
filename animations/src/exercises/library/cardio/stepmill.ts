// Face the revolving stairs, stay upright and hold the rails lightly.
// Alternate the legs as each foot climbs to the next moving step.
import type { SideExercise } from '@/exercise.ts';
import { stepper } from './_cardio-2.ts';

export default {
  ...stepper({ en: 'Stepmill', sources: ['fe:Step_Mill'] }, '楼梯机爬楼', true),
  id: 'stepmill',
} satisfies SideExercise;
