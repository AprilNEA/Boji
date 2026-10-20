// Single-arm prone hammer curl on a flat bench, side view. The chest is supported and the working upper arm hangs vertical.
// The elbow stays still while the neutral-grip dumbbell curls from about 165° to 45°.
// The non-working arm hangs quietly below the bench.
import type { SideExercise } from '@/exercise.ts';
import { makeProneFlatCurl } from './_biceps-curl-4.ts';

export default makeProneFlatCurl({
  id: 'dumbbell-single-arm-prone-hammer-curl',
  name: '单臂俯卧哑铃锤式弯举',
  en: 'Dumbbell Single-Arm Prone Hammer Curl',
  sources: ['hz:1666'],
  grip: 'hammer',
}) satisfies SideExercise;
