// Stand on flat feet and hold the two cable handles high in front of the shoulders.
// Hinge forward as both handles travel to the thighs, then return to the tall reach.
import type { SideExercise } from '@/exercise.ts';
import { skiErg } from './_cardio-2.ts';

export default {
  ...skiErg({ en: 'Ski Ergometer', sources: ['hz:2142'] }, '滑雪测功仪训练'),
  id: 'ski-ergometer',
} satisfies SideExercise;
