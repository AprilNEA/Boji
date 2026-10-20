// Single-arm reverse preacher curl, side view. The catalog variation uses a pronated grip.
// The upper arm stays on the angled pad while the elbow curls from about 165° to 45°.
// The feet remain flat and the free hand stays on the hip.
import type { SideExercise } from '@/exercise.ts';
import { makePreacherCurl } from './_biceps-curl-4.ts';

export default makePreacherCurl({
  id: 'dumbbell-single-arm-reverse-preacher-curl',
  name: '单臂哑铃牧师凳反握弯举',
  en: 'Dumbbell Single-Arm Reverse Preacher Curl',
  sources: ['hz:1414'],
  grip: 'reverse',
}) satisfies SideExercise;
