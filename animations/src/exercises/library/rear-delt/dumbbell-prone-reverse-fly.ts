// Lie chest-down on the flat bench with neutral-grip dumbbells hanging beneath the shoulders.
// Lift both soft elbows directly outward to shoulder height, hold briefly, then lower under control.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-prone-reverse-fly', name: '哑铃俯卧反向飞鸟',
  en: 'Dumbbell Prone Reverse Fly', sources: ['fe:Lying_Rear_Delt_Raise', 'hz:0348'],
}, { support: 'flat' }) satisfies FrontExercise;
