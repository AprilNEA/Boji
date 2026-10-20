// Standing alternating dumbbell overhead press, front view. One dumbbell rises from the shoulder as the other stays racked.
// The arms exchange positions continuously. The torso remains upright and the feet stay planted.
import { type PressInfo, frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'dumbbell-standing-alternating-overhead-press',
  name: '站姿交替哑铃肩上推举',
  meta: { en: 'Dumbbell Standing Alternating Overhead Press', equipment: ['dumbbell'], sources: ['hz:0414'] },
  implement: 'dumbbell',
  alternating: true,
});
