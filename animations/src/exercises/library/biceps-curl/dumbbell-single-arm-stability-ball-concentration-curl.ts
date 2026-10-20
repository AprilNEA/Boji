// Single-arm concentration curl on a stability ball, side view. The torso leans forward and the elbow braces inside the thigh.
// The braced upper arm does not swing while the elbow curls from about 165° to 45°.
// Both feet stay on the floor and the free hand rests on the hip for stability.
import type { SideExercise } from '@/exercise.ts';
import { makeBallCurl } from './_biceps-curl-4.ts';

export default makeBallCurl({
  id: 'dumbbell-single-arm-stability-ball-concentration-curl',
  name: '健身球单臂集中弯举',
  en: 'Dumbbell Single-Arm Stability Ball Concentration Curl',
  sources: ['hz:0353'],
  concentration: true,
}) satisfies SideExercise;
