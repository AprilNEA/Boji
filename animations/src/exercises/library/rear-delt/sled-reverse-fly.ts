// Face a lightly loaded sled with the rope taut, knees soft, and the straight arms holding handles near the waist.
// Pull the handles upward and apart without bending the elbows, then return while keeping rope tension.
import type { FrontExercise } from '@/exercise.ts';
import { sledReverseFly } from './_rear-delt-2.ts';

export default sledReverseFly({
  id: 'sled-reverse-fly', name: '雪橇反向飞鸟',
  en: 'Sled Reverse Fly', sources: ['fe:Sled_Reverse_Flye'],
}) satisfies FrontExercise;
