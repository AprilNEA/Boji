// Sit facing the row station with the knees soft and feet flat against the footrests.
// Pull the wide pronated bar into the lower chest, then return to a full forward reach.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-seated-wide-grip-row', name: '坐姿宽握划船', en: 'Cable Seated Wide-Grip Row',
  equipment: ['cable'], sources: ['hz:0218'], handle: 'straight', target: 'chest', wide: true,
}) satisfies SideExercise;
