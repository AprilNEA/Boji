// Sit with the chest against the pad, feet flat, and the hands on vertical neutral-grip handles.
// Squeeze the shoulder blades as the handles travel out and back, then return them slowly to the start.
import type { FrontExercise } from '@/exercise.ts';
import { machineReverseFly } from './_rear-delt-2.ts';

export default machineReverseFly({
  id: 'machine-seated-neutral-grip-reverse-fly', name: '器械坐姿对握反向飞鸟',
  en: 'Machine Seated Neutral-Grip Reverse Fly', sources: ['hz:0601'],
}, { grip: 'neutral' }) satisfies FrontExercise;
