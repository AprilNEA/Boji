// Stand tall on the pedals and hold the moving handles.
// The pedals and handles move in opposite phases without either foot leaving its pedal.
import type { SideExercise } from '@/exercise.ts';
import { elliptical } from './_cardio-2.ts';

export default {
  ...elliptical({ en: 'Elliptical Trainer Walk', sources: ['hz:2141'] }, '椭圆机行走'),
  id: 'elliptical-trainer-walk',
} satisfies SideExercise;
