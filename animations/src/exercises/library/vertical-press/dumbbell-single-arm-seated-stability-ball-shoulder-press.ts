// Seated tall on a stability ball with one pronated dumbbell at shoulder height.
// The working arm presses overhead while the other hand stabilizes on the hip; both feet stay flat.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, ballSingleDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-single-arm-seated-stability-ball-shoulder-press', name: '哑铃单臂健身球坐姿肩上推举', en: 'Dumbbell Single-Arm Seated Stability Ball Shoulder Press',
  equipment: ["dumbbell","stability-ball"],
  sources: ["hz:1290"],
} satisfies PressInfo;

const exercise = ballSingleDumbbellPress(info);
export default exercise satisfies SideExercise;
