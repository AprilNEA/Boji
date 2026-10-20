// Sit tall facing the hand cranks with the feet resting on the foot supports.
// Push and pull continuously as the two hands travel on opposite crank circles.
import type { SideExercise } from '@/exercise.ts';
import { upperErgometer } from './_cardio-2.ts';

export default {
  ...upperErgometer({ en: 'Upper-Body Ergometer', sources: ['hz:2139'] }, '上肢功率车'),
  id: 'upper-body-ergometer',
} satisfies SideExercise;
