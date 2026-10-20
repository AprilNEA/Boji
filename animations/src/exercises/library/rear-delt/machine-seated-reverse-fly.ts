// Sit with the chest against the pad, feet flat, and both hands on the overhand horizontal grips.
// Pull the grips backward and outward with soft elbows, pause with the shoulder blades together, then return.
import type { FrontExercise } from '@/exercise.ts';
import { machineReverseFly } from './_rear-delt-2.ts';

export default machineReverseFly({
  id: 'machine-seated-reverse-fly', name: '器械坐姿反向飞鸟',
  en: 'Machine Seated Reverse Fly', sources: ['hz:0602'],
}, { grip: 'overhand' }) satisfies FrontExercise;
