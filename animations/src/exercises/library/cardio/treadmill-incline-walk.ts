// Walk upright on an inclined belt with relaxed arm swing.
// The feet alternate between a planted stance and a low swing without holding the rails.
import type { SideExercise } from '@/exercise.ts';
import { treadmill } from './_cardio-2.ts';

export default {
  ...treadmill({ en: 'Treadmill Incline Walk', sources: ['hz:3666'] }, '跑步机爬坡走', 'incline'),
  id: 'treadmill-incline-walk',
} satisfies SideExercise;
