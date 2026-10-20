// Sit with the feet fixed on the platform and a straight spine.
// Pull the pronated handles from a forward reach to the torso and keep the elbows close.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-seated-overhand-row', name: '坐姿正握划船', en: 'Cable Seated Overhand Row',
  equipment: ['cable'], sources: ['hz:0239'], handle: 'straight',
}) satisfies SideExercise;
