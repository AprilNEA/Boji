// Start with a wide sumo stance inside the rack and bands assisting the bar from overhead.
// Keep the hands inside the legs as the knees and hips extend to a tall lockout.
// The feet stay wide and flat while the overhead bands remain connected to the rising bar.
import type { FrontExercise } from '@/exercise.ts';
import { frontDeadlift } from './_hinge-1.ts';

export default frontDeadlift({
  id: 'barbell-reverse-band-sumo-deadlift', name: '杠铃反向弹力带相扑硬拉', en: 'Barbell Reverse-Band Sumo Deadlift',
  sources: ['fe:Reverse_Band_Sumo_Deadlift'], sumo: true, reverseBands: true,
}) satisfies FrontExercise;
