// Sit at a support bench with one upper arm fixed on the pad and the underhand dumbbell held securely.
// The source directs a curl toward the shoulder, then a controlled return with the wrist kept neutral.
import type { SideExercise } from '@/exercise.ts';
import { sourceDumbbellCurl } from './_forearm-grip-2.ts';

export default sourceDumbbellCurl({
  id: 'dumbbell-bench-supported-single-arm-neutral-grip-wrist-curl', name: '凳上支撑哑铃单臂弯举',
  en: 'Dumbbell Bench-Supported Single-Arm Neutral-Grip Wrist Curl', sources: ['hz:0366'],
  neutral: false, preacher: true, unilateral: true,
}) satisfies SideExercise;
