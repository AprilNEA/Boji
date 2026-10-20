// Keep the chest on a shallow incline bench and allow both neutral-grip dumbbells to hang below the shoulders.
// Raise the long soft elbows perpendicular to the torso until they reach shoulder height, then lower slowly.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-incline-reverse-fly', name: '哑铃上斜俯卧反向飞鸟',
  en: 'Dumbbell Incline Reverse Fly', sources: ['fe:Dumbbell_Lying_Rear_Lateral_Raise', 'hz:0326'],
}, { support: 'incline' }) satisfies FrontExercise;
