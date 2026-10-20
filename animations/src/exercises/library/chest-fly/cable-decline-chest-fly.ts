// Stand between cable stations with the torso upright and both feet planted.
// Keep both elbows near 159° as each shoulder travels from 90° lateral to about 93° forward.
// The source describes a standing cable movement, so the pulleys and feet stay fixed.
import type { FrontExercise } from '@/exercise.ts';
import { makeCableFly } from './_chest-fly-1.ts';

export default makeCableFly({
  id: 'cable-decline-chest-fly', name: '绳索下斜夹胸', en: 'Cable Decline Chest Fly',
  sources: ['hz:0158'], style: 'mid', pulleyY: 202, lean: 2,
}) satisfies FrontExercise;
