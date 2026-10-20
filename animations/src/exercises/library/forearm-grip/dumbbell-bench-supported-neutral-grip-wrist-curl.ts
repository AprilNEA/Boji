// Sit at a support bench with the upper arms fixed against the pad and both hands holding dumbbells.
// The source directs an elbow curl toward the shoulders, followed by a controlled lower to the long-arm position.
import type { SideExercise } from '@/exercise.ts';
import { sourceDumbbellCurl } from './_forearm-grip-2.ts';

export default sourceDumbbellCurl({
  id: 'dumbbell-bench-supported-neutral-grip-wrist-curl', name: '凳上支撑哑铃弯举',
  en: 'Dumbbell Bench-Supported Neutral-Grip Wrist Curl', sources: ['hz:0365'], neutral: false, preacher: true,
}) satisfies SideExercise;
