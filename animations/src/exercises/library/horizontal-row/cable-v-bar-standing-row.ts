// Stand facing the cable column with level shoulders and a stable torso.
// Draw the close V handle to the abdomen as the shoulder blades squeeze together.
import type { SideExercise } from '@/exercise.ts';
import { standingCableRow } from './_horizontal-row-2.ts';

export default standingCableRow({
  id: 'cable-v-bar-standing-row', name: '站姿窄握把绳索划船', en: 'Cable V-Bar Standing Row',
  equipment: ['cable'], sources: ['hz:0234'], handle: 'v',
}) satisfies SideExercise;
