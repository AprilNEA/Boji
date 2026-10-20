// Smith bent-over row, side view. Stand under the guided bar with soft knees and a fixed hip hinge.
// Pull the pronated bar from below the knees to the lower chest with the elbows close to the body.
// The rails guide the bar vertically, while the torso remains nearly parallel to the floor.
import type { SideExercise } from '@/exercise.ts';
import { makeSmithBentRow } from './_horizontal-row-3.ts';

export default makeSmithBentRow({
  id: 'smith-bent-over-row', name: '史密斯俯身划船', en: 'Smith Bent-Over Row',
  equipment: ['smith', 'barbell'], sources: ['hz:1359', 'fe:Smith_Machine_Bent_Over_Row'],
}, {}) satisfies SideExercise;
