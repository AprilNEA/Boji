// Stand forward of two low pulleys with planted feet and hands beside the waist.
// Keep both elbows near 159° as the hands travel from hip level to the upper chest.
// The torso remains stable while both cable lines stay taut from their low pulley points.
import type { FrontExercise } from '@/exercise.ts';
import { makeCableFly } from './_chest-fly-1.ts';

export default makeCableFly({
  id: 'cable-low-to-high-fly', name: '绳索低位夹胸', en: 'Cable Low-to-High Fly',
  sources: ['fe:Low_Cable_Crossover', 'hz:0179'], style: 'low-high', pulleyY: 404, lean: 3,
}) satisfies FrontExercise;
