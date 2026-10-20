// Stand tall with two dumbbells racked at shoulder height and feet planted.
// Press one arm at a time while the other dumbbell remains racked; the torso stays vertical.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, alternatingDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-standing-alternating-shoulder-press', name: '哑铃站姿交替肩上推举', en: 'Dumbbell Standing Alternating Shoulder Press',
  equipment: ["dumbbell"],
  sources: ["fe:Standing_Alternating_Dumbbell_Press","hz:0286"],
} satisfies PressInfo;

const exercise = alternatingDumbbellPress(info);
export default exercise satisfies SideExercise;
