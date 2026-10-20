// Seated upright with both dumbbells racked near the ears.
// One arm presses to lockout while the other stays racked; the feet and backrest stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, alternatingDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-seated-alternating-shoulder-press', name: '哑铃坐姿交替肩上推举', en: 'Dumbbell Seated Alternating Shoulder Press',
  equipment: ["dumbbell","bench"],
  sources: ["hz:0388"],
} satisfies PressInfo;

const exercise = alternatingDumbbellPress(info, true);
export default exercise satisfies SideExercise;
