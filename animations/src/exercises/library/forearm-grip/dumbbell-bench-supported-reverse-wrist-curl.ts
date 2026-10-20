// Kneel facing a flat bench with both pronated forearms supported on the raised pad.
// The wrists extend beyond the edge and lift the dumbbells without moving the elbows or forearms.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellWristCurl } from './_forearm-grip-2.ts';

export default dumbbellWristCurl({
  id: 'dumbbell-bench-supported-reverse-wrist-curl', name: '哑铃凳上反握腕弯举',
  en: 'Dumbbell Bench-Supported Reverse Wrist Curl', sources: ['fe:Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench', 'hz:0368'],
  reverse: true, support: 'bench',
}) satisfies SideExercise;
