// Lie beneath the Smith bar with the middle of both feet centered under it and knees tucked toward the chest.
// Drive the bar upward by extending the hips and knees short of lockout, pause, and bend back to the tucked start.
import type { SideExercise } from '@/exercise.ts';
import { supineLegPress } from './_squat-3.ts';

export default supineLegPress({
  id: 'smith-machine-vertical-leg-press', name: '史密斯垂直腿举', en: 'Smith Machine Vertical Leg Press',
  sources: ['fe:Smith_Machine_Leg_Press'], smith: true,
}) satisfies SideExercise;
