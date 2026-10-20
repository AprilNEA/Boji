// Standing dumbbell overhead press, front view. Both dumbbells start at shoulder height with the palms forward.
// The arms press vertically to a locked-out overhead position and return under control. Both feet stay planted.
import { type PressInfo, frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'dumbbell-standing-overhead-press',
  name: '站姿哑铃肩上推举',
  meta: { en: 'Dumbbell Standing Overhead Press', equipment: ['dumbbell'], sources: ['hz:0426'] },
  implement: 'dumbbell',
});
