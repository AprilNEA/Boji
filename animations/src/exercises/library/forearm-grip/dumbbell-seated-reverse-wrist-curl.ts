// Sit on a flat bench with both pronated forearms resting along the thighs and wrists past the knees.
// Lift each dumbbell through wrist extension only, pause, and lower without moving either forearm.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellWristCurl } from './_forearm-grip-2.ts';

export default dumbbellWristCurl({
  id: 'dumbbell-seated-reverse-wrist-curl', name: '哑铃坐姿反向腕弯举',
  en: 'Dumbbell Seated Reverse Wrist Curl', sources: ['fe:Seated_Dumbbell_Palms-Down_Wrist_Curl', 'hz:0385'],
  reverse: true, support: 'thigh',
}) satisfies SideExercise;
