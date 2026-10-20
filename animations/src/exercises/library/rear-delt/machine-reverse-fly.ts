// Sit facing the chest pad with both hands on shoulder-height handles and keep the elbows softly bent.
// Pull the handles out and back in a semicircle, pause at the rear position, then return under control.
import type { FrontExercise } from '@/exercise.ts';
import { machineReverseFly } from './_rear-delt-2.ts';

export default machineReverseFly({
  id: 'machine-reverse-fly', name: '器械反向飞鸟',
  en: 'Machine Reverse Fly', sources: ['fe:Reverse_Machine_Flyes'],
}) satisfies FrontExercise;
