// Standing single-arm dumbbell curl, side view. The torso stays tall and both feet remain planted.
// The working upper arm stays beside the torso as the elbow curls from about 165° to 45°.
// The free hand rests on the hip while the dumbbell follows the working hand.
import type { SideExercise } from '@/exercise.ts';
import { makeStandingCurl } from './_biceps-curl-4.ts';

export default makeStandingCurl({
  id: 'dumbbell-standing-single-arm-curl',
  name: '站姿单臂哑铃弯举',
  en: 'Dumbbell Standing Single-Arm Curl',
  sources: ['hz:1670'],
}) satisfies SideExercise;
