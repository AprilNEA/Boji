// Stand tall with two kettlebells racked at the shoulders.
// Press one kettlebell at a time while the other remains racked; the feet and torso stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, alternatingKettlebellPress } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-alternating-overhead-press', name: '壶铃交替肩上推举', en: 'Kettlebell Alternating Overhead Press',
  equipment: ["kettlebell"],
  sources: ["fe:Alternating_Kettlebell_Press","hz:0520"],
} satisfies PressInfo;

const exercise = alternatingKettlebellPress(info);
export default exercise satisfies SideExercise;
