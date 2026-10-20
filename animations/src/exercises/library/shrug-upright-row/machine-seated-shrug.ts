// Sit against the machine backrest with straight arms at the side handles.
// Lift the shoulders toward the ears and lower them without rolling or leaning the torso.
import type { FrontExercise } from '@/exercise.ts';
import { frontMachineSeatedShrug } from './_shrug-upright-row.ts';

export default frontMachineSeatedShrug({
  id: 'machine-seated-shrug', name: '器械坐姿耸肩', en: 'Machine Seated Shrug', sources: ['hz:0604'],
}) satisfies FrontExercise;
