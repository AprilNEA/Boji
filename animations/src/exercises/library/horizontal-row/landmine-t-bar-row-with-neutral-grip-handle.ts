// Neutral-handle landmine T-bar row, side view. Take a wide stance and hold the chest-up hip hinge.
// Both hands pull the double-D handle from full reach to the upper abdomen without jerking.
// The bar pivots only at its anchored end, and the trunk remains steady.
import type { SideExercise } from '@/exercise.ts';
import { makeLandmineRow } from './_horizontal-row-3.ts';

export default makeLandmineRow({
  id: 'landmine-t-bar-row-with-neutral-grip-handle', name: '地雷杆对握丁字杠划船', en: 'Landmine T-Bar Row with Neutral-Grip Handle',
  equipment: ['landmine', 'barbell'], sources: ['fe:T-Bar_Row_with_Handle'],
}, { handle: true }) satisfies SideExercise;
