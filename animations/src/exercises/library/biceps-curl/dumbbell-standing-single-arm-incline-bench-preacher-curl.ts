// Standing single-arm curl over an incline bench, side view. The chest and free hand use the incline for support.
// The working upper arm stays still as the elbow curls from about 165° to 45°.
// The stance stays wide and planted while the dumbbell follows the working hand.
import type { SideExercise } from '@/exercise.ts';
import { makeStandingInclinePreacherCurl } from './_biceps-curl-4.ts';

export default makeStandingInclinePreacherCurl({
  id: 'dumbbell-standing-single-arm-incline-bench-preacher-curl',
  name: '站姿单臂上斜凳托臂哑铃弯举',
  en: 'Dumbbell Standing Single-Arm Incline Bench Preacher Curl',
  sources: ['fe:Standing_One-Arm_Dumbbell_Curl_Over_Incline_Bench', 'hz:0422', 'hz:1680'],
}) satisfies SideExercise;
