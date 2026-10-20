// Seated bilateral hammer curl on a stability ball, side view. The torso stays upright and both feet stay planted.
// The upper arms stay beside the torso while both elbows curl from about 165° to 45°.
// The profile dumbbells keep their neutral-grip handles visible throughout.
import type { SideExercise } from '@/exercise.ts';
import { makeBallCurl } from './_biceps-curl-4.ts';

export default makeBallCurl({
  id: 'dumbbell-seated-stability-ball-hammer-curl',
  name: '健身球坐姿哑铃锤式弯举',
  en: 'Dumbbell Seated Stability Ball Hammer Curl',
  sources: ['hz:1659'],
  grip: 'hammer',
  bilateral: true,
}) satisfies SideExercise;
