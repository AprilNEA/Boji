// Long-bar single-arm row, side view. Hinge with the back flat and keep the knees softly bent.
// The working arm pulls the loaded end to the lower chest as the free hand braces on the knee.
// The fixed landmine end stays on the floor, so only the arm moves through the repetition.
import type { SideExercise } from '@/exercise.ts';
import { makeLandmineRow } from './_horizontal-row-3.ts';

export default makeLandmineRow({
  id: 'landmine-single-arm-row', name: '地雷杆单臂划船', en: 'Landmine Single-Arm Row',
  equipment: ['landmine', 'barbell'], sources: ['fe:Bent_Over_One-Arm_Long_Bar_Row', 'fe:One-Arm_Long_Bar_Row'],
}, { single: true }) satisfies SideExercise;
