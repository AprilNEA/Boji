// Stand tall with one kettlebell racked and the palm initially facing inward.
// Rotate the hand while pressing overhead; the free hand, feet, and torso stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, standingKettlebellPress } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-single-arm-arnold-press', name: '壶铃单臂阿诺德推举', en: 'Kettlebell Single-Arm Arnold Press',
  equipment: ["kettlebell"],
  sources: ["fe:Kettlebell_Arnold_Press"],
} satisfies PressInfo;

const exercise = standingKettlebellPress(info, { single: true, arnold: true });
export default exercise satisfies SideExercise;
