// Hinge forward with soft knees, a flat back, and one dumbbell hanging under the shoulder.
// Pull that elbow close to the torso toward the chest while the free hand remains at the waist.
import type { SideExercise } from '@/exercise.ts';
import { hingeRow } from './_horizontal-row-2.ts';

export default hingeRow({
  id: 'dumbbell-single-arm-bent-over-row', name: '单臂哑铃俯身划船', en: 'Dumbbell Single-Arm Bent-Over Row',
  equipment: ['dumbbell'], sources: ['hz:0292'], weight: 'dumbbell', single: true,
}) satisfies SideExercise;
