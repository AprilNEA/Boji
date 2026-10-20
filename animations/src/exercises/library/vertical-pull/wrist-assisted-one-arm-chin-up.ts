// Hold the bar underhand with one hand while the free hand supports the working wrist.
// Pull until the chin passes the bar, then lower with both hands maintaining the wrist assist.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'wrist-assisted-one-arm-chin-up', name: '扶腕辅助单臂反握引体', en: 'Wrist-Assisted One-Arm Chin-Up',
  equipment: ['pull-up-bar'], sources: ['hz:0638'],
}, { wristAssist: true }) satisfies SideExercise;
