// Standing single-arm concentration curl, side view. The hips hinge forward and the free hand braces on the thigh.
// The working arm hangs vertical and its upper arm stays still as the elbow curls from about 165° to 45°.
// The profile dumbbell follows the hand to honor the first source's palm-in cue.
import type { SideExercise } from '@/exercise.ts';
import { makeStandingConcentrationCurl } from './_biceps-curl-4.ts';

export default makeStandingConcentrationCurl({
  id: 'dumbbell-standing-single-arm-concentration-curl',
  name: '站姿单臂集中哑铃弯举',
  en: 'Dumbbell Standing Single-Arm Concentration Curl',
  sources: ['hz:0418', 'hz:0421'],
  grip: 'hammer',
}) satisfies SideExercise;
