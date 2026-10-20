// Seated single-arm preacher curl, side view. The feet stay flat and the upper arm rests on the 45° preacher pad.
// The elbow stays in place as the forearm curls from about 165° to 45°.
// The free hand rests on the hip and the dumbbell follows the working hand.
import type { SideExercise } from '@/exercise.ts';
import { makePreacherCurl } from './_biceps-curl-4.ts';

export default makePreacherCurl({
  id: 'dumbbell-seated-single-arm-preacher-curl',
  name: '坐姿单臂哑铃牧师凳弯举',
  en: 'Dumbbell Seated Single-Arm Preacher Curl',
  sources: ['hz:0402'],
}) satisfies SideExercise;
