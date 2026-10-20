// Hold the bar underhand with the working arm and use the other hand lower on a towel for assistance.
// Pull the upper chest toward the bar without swinging, then descend to the long-arm position.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'towel-assisted-single-arm-chin-up', name: '毛巾辅助单臂反握引体', en: 'Towel-Assisted Single-Arm Chin-Up',
  equipment: ['pull-up-bar', 'other'], sources: ['fe:One_Arm_Chin-Up'],
}, { towel: true, lean: true }) satisfies SideExercise;
