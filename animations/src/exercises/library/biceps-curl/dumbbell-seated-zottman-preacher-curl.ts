// Seated bilateral Zottman preacher curl, side view. Both upper arms remain supported on the angled preacher pad.
// The dumbbells curl from a long elbow to a 45° elbow, then lower slowly under control.
// The end-on dumbbells represent the required forearm rotation without moving the elbows.
import type { SideExercise } from '@/exercise.ts';
import { makePreacherCurl } from './_biceps-curl-4.ts';

export default makePreacherCurl({
  id: 'dumbbell-seated-zottman-preacher-curl',
  name: '坐姿佐特曼牧师凳弯举',
  en: 'Dumbbell Seated Zottman Preacher Curl',
  sources: ['hz:2294'],
  bilateral: true,
}) satisfies SideExercise;
