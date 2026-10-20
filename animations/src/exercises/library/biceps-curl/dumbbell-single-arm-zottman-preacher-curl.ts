// Single-arm Zottman preacher curl, side view. The upper arm stays supported by the preacher pad.
// The dumbbell curls from about 165° to 45° at the elbow before the controlled lowering phase.
// The end-on dumbbell represents the source's wrist rotation without changing elbow position.
import type { SideExercise } from '@/exercise.ts';
import { makePreacherCurl } from './_biceps-curl-4.ts';

export default makePreacherCurl({
  id: 'dumbbell-single-arm-zottman-preacher-curl',
  name: '单臂佐特曼牧师凳弯举',
  en: 'Dumbbell Single-Arm Zottman Preacher Curl',
  sources: ['hz:1672'],
}) satisfies SideExercise;
