// Start in a high plank with each hand supporting weight through a kettlebell handle.
// Keep the body straight while one bell rows to the ribs, then alternate sides.
import type { SideExercise } from '@/exercise.ts';
import { renegadeKettlebellRow } from './_horizontal-row-2.ts';

export default renegadeKettlebellRow({
  id: 'kettlebell-alternating-renegade-row', name: '壶铃交替平板支撑划船', en: 'Alternating Kettlebell Renegade Row',
  equipment: ['kettlebell'], sources: ['fe:Alternating_Renegade_Row', 'hz:0521'],
}) satisfies SideExercise;
