// Start seated with both upper arms on a preacher pad and the source-specified underhand machine grip.
// Curl the handles toward the shoulders, while the chest, elbows, and upper arms remain fixed on the pad.
import type { SideExercise } from '@/exercise.ts';
import { machineCurl } from './_biceps-curl-5.ts';

export default machineCurl({
  id: 'machine-reverse-grip-preacher-curl', name: '器械反握牧师凳弯举', en: 'Machine Reverse-Grip Preacher Curl',
  equipment: ['machine'], sources: ['hz:1616'],
}, { kind: 'preacher' }) satisfies SideExercise;
