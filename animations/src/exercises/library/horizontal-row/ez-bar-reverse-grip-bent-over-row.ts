// Stand with soft knees and a flat back hinged nearly parallel to the floor.
// Keep both hands underhand on one EZ bar as it rows to the lower chest and returns below the shoulders.
import type { SideExercise } from '@/exercise.ts';
import { hingeRow } from './_horizontal-row-2.ts';

export default hingeRow({
  id: 'ez-bar-reverse-grip-bent-over-row', name: '曲杆反握俯身划船', en: 'EZ-Bar Reverse-Grip Bent-Over Row',
  equipment: ['ez-bar'], sources: ['hz:1344'], weight: 'ez-bar',
}) satisfies SideExercise;
