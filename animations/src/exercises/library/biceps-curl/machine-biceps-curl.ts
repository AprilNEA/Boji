// Start seated with the back against the pad and the elbows close to the torso.
// Curl the machine handles upward, while the seat, back, upper arms, and feet remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { machineCurl } from './_biceps-curl-5.ts';

export default machineCurl({
  id: 'machine-biceps-curl', name: '器械肱二头肌弯举', en: 'Machine Biceps Curl',
  equipment: ['machine'], sources: ['hz:0575'],
}, { kind: 'plain' }) satisfies SideExercise;
