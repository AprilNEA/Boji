// Bilateral incline spider hammer curl, side view. The chest remains supported by a 45° bench and the arms hang down.
// Both upper arms stay still while the elbows curl from about 165° to 45°.
// Profile dumbbells keep the palms-facing-each-other grip readable throughout.
import type { SideExercise } from '@/exercise.ts';
import { makeSpiderCurl } from './_biceps-curl-4.ts';

export default makeSpiderCurl({
  id: 'dumbbell-spider-hammer-curl',
  name: '哑铃蜘蛛锤式弯举',
  en: 'Dumbbell Spider Hammer Curl',
  sources: ['hz:1674'],
  grip: 'hammer',
  bilateral: true,
}) satisfies SideExercise;
