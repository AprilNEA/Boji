// Start tall with a shoulder-width stance, an overhand bar grip and only a slight knee bend.
// Keep the knees nearly fixed as the hips hinge back and the bar lowers over the feet.
// Return by extending the hips while the back remains straight and the arms stay long.
import type { SideExercise } from '@/exercise.ts';
import { barRdl } from './_hinge-1.ts';

export default barRdl({
  id: 'barbell-stiff-leg-deadlift', name: '杠铃直腿硬拉', en: 'Barbell Stiff-Leg Deadlift',
  sources: ['fe:Stiff-Legged_Barbell_Deadlift', 'hz:0116'], stiff: true,
}) satisfies SideExercise;
