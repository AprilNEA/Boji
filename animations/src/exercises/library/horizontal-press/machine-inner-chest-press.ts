// Sit with the back flat against the pad and start with the elbows at approximately right angles.
// Chest-height handles press forward until the arms extend, then return to the controlled starting depth.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'machine-inner-chest-press',
  name: '器械内胸推胸',
  en: 'Machine Inner Chest Press',
  equipment: ['machine'],
  sources: ['hz:1301'],
  kind: 'machine-seated',
  machinePath: 'level',
}) satisfies SideExercise;
