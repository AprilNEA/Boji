// Standing bilateral preacher curl, side view. The upper arms lie on the high angled preacher pad.
// Both feet and the torso remain still while the elbows curl from about 165° to 45°.
// The dumbbells move with both hands and return together under control.
import type { SideExercise } from '@/exercise.ts';
import { makeStandingPreacherCurl } from './_biceps-curl-4.ts';

export default makeStandingPreacherCurl({
  id: 'dumbbell-standing-preacher-curl',
  name: '站姿哑铃牧师凳弯举',
  en: 'Dumbbell Standing Preacher Curl',
  sources: ['hz:0428'],
}) satisfies SideExercise;
