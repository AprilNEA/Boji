// Tucked pull-up-bar inverted row, side view. Hang below the fixed bar with a medium pronated grip.
// Keep both knees tucked in front of the torso and pull the body toward the bar by flexing the elbows.
// The hands stay fixed on the bar while the tucked legs approach the station at the contracted top.
import type { SideExercise } from '@/exercise.ts';
import { makeTuckedInvertedRow } from './_horizontal-row-3.ts';

export default makeTuckedInvertedRow({
  id: 'pull-up-bar-tucked-inverted-row', name: '单杠收腿反向划船', en: 'Pull-Up Bar Tucked Inverted Row',
  equipment: ['pull-up-bar', 'bodyweight'], sources: ['fe:Bodyweight_Mid_Row'],
}) satisfies SideExercise;
