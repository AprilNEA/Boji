// Sit at a flat bench with one pronated forearm supported on the pad and the wrist beyond its edge.
// The source directs wrist extension upward and a slow lower while the supported forearm remains still.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellWristCurl } from './_forearm-grip-2.ts';

export default dumbbellWristCurl({
  id: 'dumbbell-bench-supported-single-arm-wrist-curl', name: '凳上支撑哑铃单臂反向腕弯举',
  en: 'Dumbbell Bench-Supported Single-Arm Wrist Curl', sources: ['hz:0367'],
  reverse: true, unilateral: true, support: 'bench',
}) satisfies SideExercise;
