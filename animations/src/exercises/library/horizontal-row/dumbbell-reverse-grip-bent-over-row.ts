// Stand in a stable hip hinge with a straight back and dumbbells held with the source's overhand grip.
// Let both arms hang below the shoulders, then row the weights toward the chest without changing the torso angle.
import type { SideExercise } from '@/exercise.ts';
import { hingeRow } from './_horizontal-row-2.ts';

export default hingeRow({
  id: 'dumbbell-reverse-grip-bent-over-row', name: '哑铃正握俯身划船', en: 'Dumbbell Reverse-Grip Bent-Over Row',
  equipment: ['dumbbell'], sources: ['hz:2327'], weight: 'dumbbell', reverse: true,
}) satisfies SideExercise;
