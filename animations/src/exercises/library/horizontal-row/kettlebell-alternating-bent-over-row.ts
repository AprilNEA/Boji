// Hinge with soft knees and keep both kettlebells hanging under the shoulders.
// Row one bell to the ribs while the opposite arm stays extended, then alternate without torso rotation.
import type { SideExercise } from '@/exercise.ts';
import { hingeRow } from './_horizontal-row-2.ts';

export default hingeRow({
  id: 'kettlebell-alternating-bent-over-row', name: '壶铃交替俯身划船', en: 'Alternating Kettlebell Bent-Over Row',
  equipment: ['kettlebell'], sources: ['fe:Alternating_Kettlebell_Row', 'hz:0522'], weight: 'kettlebell', alternating: true,
}) satisfies SideExercise;
