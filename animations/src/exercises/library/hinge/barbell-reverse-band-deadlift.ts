// Start under an overhead rack with bands assisting a floor bar at hip-width stance.
// Extend the knees and hips through a braced pull while the bands shorten as the bar rises.
// The feet stay flat, the hands remain on the bar, and the bands stay anchored overhead.
import type { FrontExercise } from '@/exercise.ts';
import { frontDeadlift } from './_hinge-1.ts';

export default frontDeadlift({
  id: 'barbell-reverse-band-deadlift', name: '杠铃反向弹力带硬拉', en: 'Barbell Reverse-Band Deadlift',
  sources: ['fe:Reverse_Band_Deadlift'], reverseBands: true,
}) satisfies FrontExercise;
