// Sit upright with the feet on the linked pedals and hands on the moving handles.
// Each pedal and handle travels opposite its partner in a smooth continuous cycle.
import type { SideExercise } from '@/exercise.ts';
import { elliptical } from './_cardio-2.ts';

export default {
  ...elliptical({ en: 'Seated Cross Trainer', sources: ['hz:2331'] }, '坐式交叉训练机', true),
  id: 'seated-cross-trainer',
} satisfies SideExercise;
