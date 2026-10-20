// Sit on a flat bench with both palm-up forearms resting along the thighs and wrists outside the knees.
// Curl both dumbbells up through the wrists, pause, and lower while the forearms remain on the thighs.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellWristCurl } from './_forearm-grip-2.ts';

export default dumbbellWristCurl({
  id: 'dumbbell-seated-wrist-curl', name: '哑铃坐姿腕弯举',
  en: 'Dumbbell Seated Wrist Curl', sources: ['fe:Seated_Dumbbell_Palms-Up_Wrist_Curl', 'hz:0401'],
  reverse: false, support: 'thigh',
}) satisfies SideExercise;
