// Standing hammer curl, side view. The source instructs one dumbbell in each hand and both upper arms remain close to the torso.
// Both neutral-grip dumbbells curl from about 165° to 45° at the elbow.
// The torso stays tall and both feet remain planted throughout.
import type { SideExercise } from '@/exercise.ts';
import { makeStandingCurl } from './_biceps-curl-4.ts';

export default makeStandingCurl({
  id: 'dumbbell-standing-single-arm-hammer-curl',
  name: '站姿哑铃锤式弯举',
  en: 'Dumbbell Standing Single-Arm Hammer Curl',
  sources: ['hz:1671'],
  grip: 'hammer',
  bilateral: true,
}) satisfies SideExercise;
