// Keep the chest on a shallow incline pad and use the free hand to stabilize the bench.
// Lift the neutral-grip dumbbell sideways with a soft elbow to shoulder height, then lower slowly.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-single-arm-incline-reverse-fly', name: '哑铃单臂上斜俯卧反向飞鸟',
  en: 'Dumbbell Single-Arm Incline Reverse Fly', sources: ['fe:Dumbbell_Lying_One-Arm_Rear_Lateral_Raise'],
}, { support: 'incline', unilateral: true }) satisfies FrontExercise;
