// Single-arm prone reverse curl on a flat bench, side view. The chest stays supported and the arm hangs toward the floor.
// The upper arm stays vertical while the elbow curls from about 165° to 45°.
// The end-on dumbbell represents the required palm-down grip.
import type { SideExercise } from '@/exercise.ts';
import { makeProneFlatCurl } from './_biceps-curl-4.ts';

export default makeProneFlatCurl({
  id: 'dumbbell-single-arm-prone-reverse-curl',
  name: '单臂俯卧哑铃反握弯举',
  en: 'Dumbbell Single-Arm Prone Reverse Curl',
  sources: ['hz:1665'],
  grip: 'reverse',
}) satisfies SideExercise;
