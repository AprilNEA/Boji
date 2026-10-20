// Sit with the chest supported, feet flat, and a wide overhand handle position at shoulder level.
// Pull the handles toward the chest with elbows flared, squeeze the upper back, then release under control.
import type { FrontExercise } from '@/exercise.ts';
import { machineReverseFly } from './_rear-delt-2.ts';

export default machineReverseFly({
  id: 'smith-rear-delt-row', name: '史密斯后束划船',
  en: 'Smith Rear Delt Row', sources: ['hz:0762'],
}, { grip: 'overhand', row: true, equipment: 'smith' }) satisfies FrontExercise;
