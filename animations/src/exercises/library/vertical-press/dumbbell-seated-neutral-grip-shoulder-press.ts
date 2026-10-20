// Seated upright with neutral-grip dumbbells at shoulder height.
// Both weights press overhead with palms facing each other; the feet and backrest remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, seatedDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-seated-neutral-grip-shoulder-press', name: '哑铃坐姿对握肩上推举', en: 'Dumbbell Seated Neutral-Grip Shoulder Press',
  equipment: ["dumbbell","bench"],
  sources: ["hz:0404"],
} satisfies PressInfo;

const exercise = seatedDumbbellPress(info, true);
export default exercise satisfies SideExercise;
