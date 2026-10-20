// Start folded under a rear-shoulder bar resting on pins at the bottom hinge position.
// Keep the knees slightly bent and the back braced as the hips extend to standing.
// Return the bar to the fixed pins without shifting the feet or losing spinal alignment.
import type { SideExercise } from '@/exercise.ts';
import { goodMorning } from './_hinge-1.ts';

export default goodMorning({
  id: 'barbell-good-morning-off-pins', name: '杠铃插销起始早安式体前屈', en: 'Barbell Good Morning off Pins',
  sources: ['fe:Good_Morning_off_Pins'], bar: true, offPins: true,
}) satisfies SideExercise;
