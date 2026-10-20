// Single-arm hammer preacher curl, side view. The upper arm stays against the 45° preacher pad and the feet stay flat.
// The working elbow stays fixed while the neutral-grip dumbbell curls from about 165° to 45°.
// The free hand rests on the hip throughout the repetition.
import type { SideExercise } from '@/exercise.ts';
import { makePreacherCurl } from './_biceps-curl-4.ts';

export default makePreacherCurl({
  id: 'dumbbell-single-arm-hammer-preacher-curl',
  name: '单臂哑铃锤式牧师凳弯举',
  en: 'Dumbbell Single-Arm Hammer Preacher Curl',
  sources: ['hz:1663'],
  grip: 'hammer',
}) satisfies SideExercise;
