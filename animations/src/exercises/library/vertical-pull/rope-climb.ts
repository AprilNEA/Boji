// Grip the climbing rope with both hands, reach one hand to the next high hold, and pull the body upward.
// Pinch the rope between the feet while the lower hand controls the climb, then return under control.
import type { SideExercise } from '@/exercise.ts';
import { ropeClimb } from './_vertical-pull-2.ts';

export default ropeClimb({
  id: 'rope-climb', name: '爬绳', en: 'Rope Climb', equipment: ['rope'],
  sources: ['fe:Rope_Climb', 'hz:0680'],
}) satisfies SideExercise;
