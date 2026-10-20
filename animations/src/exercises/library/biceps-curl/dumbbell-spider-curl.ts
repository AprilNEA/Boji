// Bilateral incline spider curl, side view. The chest and stomach remain on a 45° incline bench.
// Both upper arms hang straight down and remain still as the elbows curl from about 165° to 45°.
// The end-on dumbbells represent the palm-down grip specified by the source instructions.
import type { SideExercise } from '@/exercise.ts';
import { makeSpiderCurl } from './_biceps-curl-4.ts';

export default makeSpiderCurl({
  id: 'dumbbell-spider-curl',
  name: '哑铃蜘蛛弯举',
  en: 'Dumbbell Spider Curl',
  sources: ['hz:0374'],
  grip: 'reverse',
  bilateral: true,
}) satisfies SideExercise;
