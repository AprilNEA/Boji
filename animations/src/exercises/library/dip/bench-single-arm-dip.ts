// Single-arm bench dip, side view. One hand fixes on the bench behind the hip while both heels remain grounded.
// The working elbow flexes to a controlled bottom position and then extends; the free hand stays on the hip.
import type { SideExercise } from '@/exercise.ts';
import { benchDip } from './_dip.ts';

export default benchDip({
  id: 'bench-single-arm-dip', name: '单臂凳上反向臂屈伸', en: 'Bench Single-Arm Dip', equipment: ['bench'],
  sources: ['hz:0639'],
}, { unilateral: true }) satisfies SideExercise;
