// Standing wide-grip military press, front view. The wide hand spacing is visible at the front shoulders.
// Both arms press overhead and return to the shoulders without leg drive. The torso remains vertical.
import { frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'barbell-standing-wide-grip-military-press',
  name: '站姿宽握杠铃军用推举',
  meta: { en: 'Barbell Standing Wide-Grip Military Press', equipment: ['barbell'], sources: ['hz:1457'] },
  implement: 'barbell',
  style: 'wide',
});
