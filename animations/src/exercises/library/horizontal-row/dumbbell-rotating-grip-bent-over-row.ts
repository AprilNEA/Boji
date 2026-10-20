// Keep the knees soft and the torso fixed in a flat-back hip hinge.
// Row both dumbbells toward the chest while turning the palms outward, then rotate back as they lower.
import type { SideExercise } from '@/exercise.ts';
import { hingeRow } from './_horizontal-row-2.ts';

export default hingeRow({
  id: 'dumbbell-rotating-grip-bent-over-row', name: '哑铃转握俯身划船', en: 'Dumbbell Rotating-Grip Bent-Over Row',
  equipment: ['dumbbell'], sources: ['hz:1329'], weight: 'dumbbell', rotate: true,
}) satisfies SideExercise;
