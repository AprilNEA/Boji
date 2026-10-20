// Kneel facing a flat bench with both supinated forearms on the raised pad.
// The wrists hang outside the pad and flex the dumbbells upward while each forearm stays supported.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellWristCurl } from './_forearm-grip-2.ts';

export default dumbbellWristCurl({
  id: 'dumbbell-bench-supported-wrist-curl', name: '哑铃凳上正握腕弯举',
  en: 'Dumbbell Bench-Supported Wrist Curl', sources: ['fe:Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench', 'hz:0369'],
  reverse: false, support: 'bench',
}) satisfies SideExercise;
