// Seated on a supported bench with pronated dumbbells at shoulder height.
// Both arms press together to a soft overhead lockout; the feet and backrest remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, seatedDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-seated-shoulder-press', name: '哑铃坐姿肩上推举', en: 'Dumbbell Seated Shoulder Press',
  equipment: ["dumbbell","bench"],
  sources: ["fe:Dumbbell_Shoulder_Press","fe:Seated_Dumbbell_Press","hz:0290","hz:0405"],
} satisfies PressInfo;

const exercise = seatedDumbbellPress(info);
export default exercise satisfies SideExercise;
