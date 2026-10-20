// Stand between chest-height pulleys with soft knees and a small forward lean.
// Keep both elbows near 159° as each shoulder travels from 90° lateral to about 95° forward.
// Both feet, pulley points, cable lines, and hand-held D-handles stay fixed to their supports.
import type { FrontExercise } from '@/exercise.ts';
import { makeCableFly } from './_chest-fly-1.ts';

export default makeCableFly({
  id: 'cable-mid-height-fly', name: '绳索中位夹胸', en: 'Cable Mid-Height Fly',
  sources: ['hz:0188'], style: 'mid', pulleyY: 156, lean: 6,
}) satisfies FrontExercise;
