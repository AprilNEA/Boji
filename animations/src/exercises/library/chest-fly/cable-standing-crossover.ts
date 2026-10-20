// Stand upright between chest-height pulleys with shoulder-width planted feet.
// Keep both elbows about 171° as each shoulder crosses from 90° lateral to about 94° forward.
// The torso is fixed while the pulleys, cables, and D-handles remain connected to both hands.
import type { FrontExercise } from '@/exercise.ts';
import { makeCableFly } from './_chest-fly-1.ts';

export default makeCableFly({
  id: 'cable-standing-crossover', name: '绳索站姿交叉夹胸', en: 'Cable Standing Crossover',
  sources: ['hz:1269'], style: 'cross', pulleyY: 156, straight: true,
}) satisfies FrontExercise;
