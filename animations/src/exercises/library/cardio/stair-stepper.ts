// Stand upright on the linked pedals and hold both rails for balance.
// Press one pedal down as the other rises without driving either pedal to the floor.
import type { SideExercise } from '@/exercise.ts';
import { stepper } from './_cardio-2.ts';

export default {
  ...stepper({ en: 'Stair Stepper', sources: ['fe:Stairmaster'] }, '踏步机踏步'),
  id: 'stair-stepper',
} satisfies SideExercise;
