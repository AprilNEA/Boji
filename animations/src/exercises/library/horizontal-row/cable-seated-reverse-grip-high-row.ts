// Sit tall with the feet grounded and the cable held with an underhand grip.
// Draw the attachment to the upper torso, then extend the arms without rounding the back.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-seated-reverse-grip-high-row', name: '坐姿反握高位划船', en: 'Cable Seated Reverse-Grip High Row',
  equipment: ['cable'], sources: ['hz:0208'], handle: 'straight', target: 'chest',
}) satisfies SideExercise;
