// Standing concentration curl, side view. The hips hinge forward about 40° while the working arm hangs vertical.
// The working upper arm stays still as the elbow curls from about 165° to 45°.
// The free hand braces on the thigh and both feet remain planted.
import type { SideExercise } from '@/exercise.ts';
import { makeStandingConcentrationCurl } from './_biceps-curl-4.ts';

export default makeStandingConcentrationCurl({
  id: 'dumbbell-standing-concentration-curl',
  name: '站姿集中哑铃弯举',
  en: 'Dumbbell Standing Concentration Curl',
  sources: ['fe:Standing_Concentration_Curl'],
}) satisfies SideExercise;
