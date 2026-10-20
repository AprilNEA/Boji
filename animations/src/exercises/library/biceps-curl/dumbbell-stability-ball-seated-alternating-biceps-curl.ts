// Seated alternating dumbbell curl on a stability ball, side view. The spine stays tall and the feet remain planted.
// One elbow curls from about 165° to 45° while the other arm stays long, then the sides exchange.
// Both dumbbells remain in the hands with the upper arms held beside the torso.
import type { SideExercise } from '@/exercise.ts';
import { makeBallCurl } from './_biceps-curl-4.ts';

export default makeBallCurl({
  id: 'dumbbell-stability-ball-seated-alternating-biceps-curl',
  name: '健身球坐姿交替哑铃弯举',
  en: 'Dumbbell Stability Ball Seated Alternating Biceps Curl',
  sources: ['hz:1650'],
  bilateral: true,
  alternate: true,
}) satisfies SideExercise;
