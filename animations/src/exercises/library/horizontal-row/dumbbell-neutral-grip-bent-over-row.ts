// Hinge forward with soft knees and keep the neutral-grip dumbbells below the shoulders.
// Pull both elbows toward the ribs while the spine remains fixed, then lower the weights together.
import type { SideExercise } from '@/exercise.ts';
import { hingeRow } from './_horizontal-row-2.ts';

export default hingeRow({
  id: 'dumbbell-neutral-grip-bent-over-row', name: '哑铃对握俯身划船', en: 'Dumbbell Neutral-Grip Bent-Over Row',
  equipment: ['dumbbell'], sources: ['fe:Bent_Over_Two-Dumbbell_Row_With_Palms_In'], weight: 'dumbbell',
}) satisfies SideExercise;
