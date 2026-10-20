// Start tall with the bar across the rear shoulders, a tight upper back and soft knees.
// Send the hips back until the torso nears parallel without rounding, then extend to stand.
// The bar stays pinned below the neck and the feet remain planted through the hinge.
import type { SideExercise } from '@/exercise.ts';
import { goodMorning } from './_hinge-1.ts';

export default goodMorning({
  id: 'barbell-good-morning', name: '杠铃早安式体前屈', en: 'Barbell Good Morning',
  sources: ['fe:Good_Morning', 'hz:0044'], bar: true, startTall: true,
}) satisfies SideExercise;
