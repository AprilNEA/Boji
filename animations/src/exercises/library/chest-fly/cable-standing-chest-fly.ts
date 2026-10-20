// Stand forward of chest-height pulleys with one foot subtly ahead and the spine neutral.
// Keep both elbows near 159° as each shoulder travels from 90° lateral to about 93° forward.
// The feet, torso, pulleys, cable lines, and D-handles stay controlled and connected.
import type { FrontExercise } from '@/exercise.ts';
import { makeCableFly } from './_chest-fly-1.ts';

export default makeCableFly({
  id: 'cable-standing-chest-fly', name: '绳索站姿夹胸', en: 'Cable Standing Chest Fly',
  sources: ['hz:0155', 'hz:0227'], style: 'mid', pulleyY: 156, lean: 3,
}) satisfies FrontExercise;
