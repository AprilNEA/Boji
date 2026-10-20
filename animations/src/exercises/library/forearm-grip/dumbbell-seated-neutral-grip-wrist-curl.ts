// Sit upright with both dumbbells in a neutral grip and the feet fixed flat on the floor.
// The source directs both dumbbells to curl toward the shoulders, then lower with the upper arms still.
import type { SideExercise } from '@/exercise.ts';
import { sourceDumbbellCurl } from './_forearm-grip-2.ts';

export default sourceDumbbellCurl({
  id: 'dumbbell-seated-neutral-grip-wrist-curl', name: '哑铃坐姿对握弯举',
  en: 'Dumbbell Seated Neutral-Grip Wrist Curl', sources: ['hz:0397'], neutral: true,
}) satisfies SideExercise;
