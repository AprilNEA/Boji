// Single-arm dumbbell preacher curl, side view. The upper arm stays on the sloped pad and the elbow does not lift.
// The forearm moves through the curl range from about 165° to 45° at the elbow.
// The seated figure keeps both feet planted and the other hand on the hip.
import type { SideExercise } from '@/exercise.ts';
import { makePreacherCurl } from './_biceps-curl-4.ts';

export default makePreacherCurl({
  id: 'dumbbell-single-arm-preacher-curl',
  name: '单臂哑铃牧师凳弯举',
  en: 'Dumbbell Single-Arm Preacher Curl',
  sources: ['fe:One_Arm_Dumbbell_Preacher_Curl'],
}) satisfies SideExercise;
