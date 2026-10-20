// Stand between chest-height pulleys in a stable staggered stance with a soft elbow bend.
// Keep both elbows near 159° as each shoulder crosses from 90° lateral to about 94° forward.
// The torso, feet, cable anchors, and hand-held handles remain stable through the shoulder arc.
import type { FrontExercise } from '@/exercise.ts';
import { makeCableFly } from './_chest-fly-1.ts';

export default makeCableFly({
  id: 'cable-upper-chest-crossover', name: '绳索上胸交叉夹胸', en: 'Cable Upper-Chest Crossover',
  sources: ['hz:1270'], style: 'cross', pulleyY: 156, lean: 3,
}) satisfies FrontExercise;
