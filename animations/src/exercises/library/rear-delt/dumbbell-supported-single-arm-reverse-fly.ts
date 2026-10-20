// Sit forward on a bench with both feet flat, hinge over the thighs, and brace the free hand on the bench.
// Raise the loaded arm out to the side with a soft elbow until level, then lower it without turning the torso.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-supported-single-arm-reverse-fly', name: '哑铃支撑式单臂反向飞鸟',
  en: 'Dumbbell Supported Single-Arm Reverse Fly', sources: ['hz:0359'],
}, { support: 'seated', unilateral: true }) satisfies FrontExercise;
