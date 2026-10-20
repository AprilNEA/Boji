// Suspension trainer row, side view. Face the anchor, lean back with straight body alignment, and keep the heels down.
// Pull the chest toward the neutral handles without bending at the hips or shrugging.
// The fixed straps remain taut as the elbows bend and extend through the repetition.
import type { SideExercise } from '@/exercise.ts';
import { makeSuspensionRow } from './_horizontal-row-3.ts';

export default makeSuspensionRow({
  id: 'suspension-trainer-row', name: '悬吊训练器划船', en: 'Suspension Trainer Row',
  equipment: ['suspension', 'bodyweight'], sources: ['hz:0808'],
}) satisfies SideExercise;
