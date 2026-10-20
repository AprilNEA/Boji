// Sit upright against the leverage-machine backrest under the shoulder pads.
// Elevate both shoulders without pulling the arms, then return to the relaxed pad position.
import type { FrontExercise } from '@/exercise.ts';
import { frontMachineSeatedShrug } from './_shrug-upright-row.ts';

export default frontMachineSeatedShrug({
  id: 'machine-gripless-shrug', name: '器械无握持耸肩', en: 'Machine Gripless Shrug',
  sources: ['hz:0580', 'hz:1439'],
}) satisfies FrontExercise;
