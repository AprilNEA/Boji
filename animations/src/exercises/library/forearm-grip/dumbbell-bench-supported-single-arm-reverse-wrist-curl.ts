// Kneel at a flat bench with one pronated forearm resting along the pad and the wrist over the edge.
// The dumbbell rises through wrist extension only, while the elbow and forearm stay fixed on the bench.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellWristCurl } from './_forearm-grip-2.ts';

export default dumbbellWristCurl({
  id: 'dumbbell-bench-supported-single-arm-reverse-wrist-curl', name: '凳上支撑哑铃单臂反向腕弯举',
  en: 'Dumbbell Bench-Supported Single-Arm Reverse Wrist Curl', sources: ['hz:1441'],
  reverse: true, unilateral: true, support: 'bench',
}) satisfies SideExercise;
