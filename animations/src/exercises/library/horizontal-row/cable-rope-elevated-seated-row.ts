// Sit tall on the raised seat with the feet fixed on the footplate.
// Pull the neutral rope grips into the torso, then return with the spine controlled.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-rope-elevated-seated-row', name: '高座绳索划船', en: 'Cable Rope Elevated Seated Row',
  equipment: ['cable'], sources: ['hz:1321'], handle: 'rope', elevated: true,
}) satisfies SideExercise;
