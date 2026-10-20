// Sit at the row station with flat feet braced against the footplate.
// The rope starts at arm's length and returns toward the abdomen as both elbows retract.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-rope-seated-row', name: '绳把坐姿划船', en: 'Cable Rope Seated Row',
  equipment: ['cable'], sources: ['hz:1323'], handle: 'rope',
}) satisfies SideExercise;
