// Sit behind the Smith bar with both hands at the lower rail position.
// Press the bar vertically in front of the face to a soft lockout; feet and bench contact stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, smithPress } from './_vertical-press-2.ts';

const info = {
  id: 'smith-machine-seated-shoulder-press', name: '史密斯机坐姿肩上推举', en: 'Smith Machine Seated Shoulder Press',
  equipment: ["smith","bench"],
  sources: ["fe:Smith_Machine_Overhead_Shoulder_Press"],
} satisfies PressInfo;

const exercise = smithPress(info);
export default exercise satisfies SideExercise;
