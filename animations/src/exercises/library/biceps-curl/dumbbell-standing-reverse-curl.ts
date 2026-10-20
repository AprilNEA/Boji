// Standing bilateral reverse curl, side view. The torso stays tall and the upper arms remain beside it.
// Both elbows curl from about 165° to 45° without shoulder swing.
// End-on dumbbells represent the palm-down grip stated by the first source.
import type { SideExercise } from '@/exercise.ts';
import { makeStandingCurl } from './_biceps-curl-4.ts';

export default makeStandingCurl({
  id: 'dumbbell-standing-reverse-curl',
  name: '站姿哑铃反握弯举',
  en: 'Dumbbell Standing Reverse Curl',
  sources: ['fe:Standing_Dumbbell_Reverse_Curl', 'hz:0429'],
  grip: 'reverse',
  bilateral: true,
}) satisfies SideExercise;
