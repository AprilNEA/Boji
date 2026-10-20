// Stand tall with neutral-grip dumbbells racked at shoulder height.
// Both arms press overhead with palms facing each other; the feet stay planted and torso stays vertical.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, standingDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-standing-neutral-grip-shoulder-press', name: '哑铃站姿对握肩上推举', en: 'Dumbbell Standing Neutral-Grip Shoulder Press',
  equipment: ["dumbbell"],
  sources: ["fe:Standing_Palms-In_Dumbbell_Press","hz:0427"],
} satisfies PressInfo;

const exercise = standingDumbbellPress(info, { neutral: true });
export default exercise satisfies SideExercise;
