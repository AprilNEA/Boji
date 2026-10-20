// Seated single-arm curl on a stability ball, side view. The torso is upright and both feet remain flat.
// The upper arm stays still as the elbow curls from about 165° to 45°.
// The other hand rests on the hip for balance while the dumbbell follows the working hand.
import type { SideExercise } from '@/exercise.ts';
import { makeBallCurl } from './_biceps-curl-4.ts';

export default makeBallCurl({
  id: 'dumbbell-single-arm-seated-curl-on-stability-ball',
  name: '健身球坐姿单臂哑铃弯举',
  en: 'Dumbbell Single-Arm Seated Curl on Stability Ball',
  sources: ['hz:1668', 'hz:1679'],
}) satisfies SideExercise;
