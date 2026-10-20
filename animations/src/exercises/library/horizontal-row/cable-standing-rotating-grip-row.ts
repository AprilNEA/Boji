// Stand back from a waist-height cable with soft knees and a braced back.
// Pull the handle into the torso while the grip turns from pronated to supinated.
import type { SideExercise } from '@/exercise.ts';
import { standingCableRow } from './_horizontal-row-2.ts';

export default standingCableRow({
  id: 'cable-standing-rotating-grip-row', name: '站姿转握绳索划船', en: 'Cable Standing Rotating-Grip Row',
  equipment: ['cable'], sources: ['hz:1319'], handle: 'straight', rotate: true,
}) satisfies SideExercise;
