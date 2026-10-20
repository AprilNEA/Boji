// Stand centered between the machine handles with both arms straight and the torso tall.
// Move the load vertically by elevating the shoulders toward the ears, then lower under control.
import type { FrontExercise } from '@/exercise.ts';
import { frontMachineStandingShrug } from './_shrug-upright-row.ts';

export default frontMachineStandingShrug({
  id: 'machine-shrug', name: '器械耸肩', en: 'Machine Shrug', sources: ['fe:Leverage_Shrug'],
}) satisfies FrontExercise;
