// Seated alternating hammer curl on a stability ball, side view. The torso stays upright and both feet stay flat.
// Each neutral-grip dumbbell curls from about 165° to 45° while the other arm remains extended.
// The elbows remain beside the torso while the two sides alternate.
import type { SideExercise } from '@/exercise.ts';
import { makeBallCurl } from './_biceps-curl-4.ts';

export default makeBallCurl({
  id: 'dumbbell-stability-ball-seated-alternating-hammer-curl',
  name: '健身球坐姿交替哑铃锤式弯举',
  en: 'Dumbbell Stability Ball Seated Alternating Hammer Curl',
  sources: ['hz:1676'],
  grip: 'hammer',
  bilateral: true,
  alternate: true,
}) satisfies SideExercise;
