// Stand upright between high pulleys with both elbows extended and the arms forming a T.
// Keep both elbows about 171° while the shoulders travel from 90° lateral to 5° at the sides.
// The body stays tall while each cable remains attached from its pulley to its hand.
import type { FrontExercise } from '@/exercise.ts';
import { makeCableFly } from './_chest-fly-1.ts';

export default makeCableFly({
  id: 'cable-iron-cross', name: '绳索十字下压夹胸', en: 'Cable Iron Cross',
  sources: ['fe:Cable_Iron_Cross'], style: 'iron-cross', pulleyY: 64, straight: true,
}) satisfies FrontExercise;
