// Stand tall with pronated dumbbells racked at shoulder height.
// Both arms press overhead without leg drive or back lean; the feet stay planted.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, standingDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-standing-shoulder-press', name: '哑铃站姿肩上推举', en: 'Dumbbell Standing Shoulder Press',
  equipment: ["dumbbell"],
  sources: ["fe:Standing_Dumbbell_Press"],
} satisfies PressInfo;

const exercise = standingDumbbellPress(info);
export default exercise satisfies SideExercise;
