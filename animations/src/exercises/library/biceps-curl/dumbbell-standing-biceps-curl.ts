// Standing bilateral dumbbell curl, side view. The torso stays tall and both feet remain planted.
// The upper arms stay beside the torso while both elbows curl from about 165° to 45°.
// Both dumbbells return together under control without swinging the shoulders.
import type { SideExercise } from '@/exercise.ts';
import { makeStandingCurl } from './_biceps-curl-4.ts';

export default makeStandingCurl({
  id: 'dumbbell-standing-biceps-curl',
  name: '站姿哑铃弯举',
  en: 'Dumbbell Standing Biceps Curl',
  sources: ['hz:0416', 'hz:0853'],
  bilateral: true,
}) satisfies SideExercise;
