// Landmine T-bar row, side view. Straddle the anchored bar with soft knees and a stable hip hinge.
// Both hands pull the sleeve to the lower chest, with the elbows travelling close to the torso.
// The landmine base remains fixed on the floor and the spine stays flat throughout.
import type { SideExercise } from '@/exercise.ts';
import { makeLandmineRow } from './_horizontal-row-3.ts';

export default makeLandmineRow({
  id: 'landmine-t-bar-row', name: '地雷杆丁字杠划船', en: 'Landmine T-Bar Row',
  equipment: ['landmine', 'barbell'], sources: ['fe:Bent_Over_Two-Arm_Long_Bar_Row'],
}, {}) satisfies SideExercise;
