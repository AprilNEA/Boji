// Stand facing away from one chest-height anchor with planted feet and a neutral torso.
// Keep both elbows near 159° as each shoulder travels from 90° lateral to about 94° forward.
// The post stays fixed and each band stays attached to its hand throughout the repetition.
import type { FrontExercise } from '@/exercise.ts';
import { makeBandCrossover } from './_chest-fly-1.ts';

export default makeBandCrossover(
  'band-chest-crossover', '弹力带夹胸', 'Band Chest Crossover', ['fe:Cross_Over_-_With_Bands'],
) satisfies FrontExercise;
