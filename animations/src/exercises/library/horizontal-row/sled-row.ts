// Sled row, side view. Face the loaded sled with soft knees, a tall chest, and both ropes under tension.
// Pull both handles to the torso by flexing the elbows and retracting the shoulder blades.
// The sled remains in front and the ropes visibly shorten as the arms row.
import type { SideExercise } from '@/exercise.ts';
import { makeSledRow } from './_horizontal-row-3.ts';

export default makeSledRow({
  id: 'sled-row', name: '雪橇划船', en: 'Sled Row',
  equipment: ['sled', 'rope'], sources: ['fe:Sled_Row'],
}) satisfies SideExercise;
