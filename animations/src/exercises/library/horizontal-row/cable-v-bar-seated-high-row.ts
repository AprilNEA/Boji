// Sit upright facing the cable station with the feet stable on the floor.
// Pull the close neutral V handle toward the upper torso, then return under control.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-v-bar-seated-high-row', name: '窄握把坐姿高位划船', en: 'Cable V-Bar Seated High Row',
  equipment: ['cable'], sources: ['hz:0213'], handle: 'v', target: 'chest',
}) satisfies SideExercise;
