// Start over the weighted implement with both hands and a braced chest.
// Lift it from the floor and use the legs to drive it forward onto the raised stair platform.
// The stepped platform remains fixed while the load stays under both hands.
import type { SideExercise } from '@/exercise.ts';
import { powerStairs } from './_carry-strongman.ts';

export default powerStairs({
  id: 'power-stairs', name: '大力士负重搬运上阶', en: 'Power Stairs',
  equipment: ['other'], sources: ['fe:Power_Stairs'],
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'quads', side: 'both', scale: 0.75 }, { m: 'glutes', scale: 0.7 }, { m: 'lowerBack', scale: 0.55 }, { m: 'traps', scale: 0.4 }],
}) satisfies SideExercise;
