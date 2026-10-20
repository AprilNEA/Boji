// Standing single-arm reverse curl, side view. The torso stays tall and the upper arm remains beside it.
// The working elbow curls from about 165° to 45° without shoulder swing.
// End-on dumbbells represent the overhand grip prescribed by both source instructions.
import type { SideExercise } from '@/exercise.ts';
import { makeStandingCurl } from './_biceps-curl-4.ts';

export default makeStandingCurl({
  id: 'dumbbell-standing-single-arm-reverse-curl',
  name: '站姿单臂哑铃反握弯举',
  en: 'Dumbbell Standing Single-Arm Reverse Curl',
  sources: ['hz:0425', 'hz:1667'],
  grip: 'reverse',
}) satisfies SideExercise;
