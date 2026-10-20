// Standing close-grip military press, front view. The close hand spacing is visible at the front shoulders.
// The arms press to full overhead extension and lower to the collarbone. The feet remain flat and still.
import { frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'barbell-standing-close-grip-military-press',
  name: '站姿窄握杠铃军用推举',
  meta: { en: 'Barbell Standing Close-Grip Military Press', equipment: ['barbell'], sources: ['hz:1456'] },
  implement: 'barbell',
  style: 'close',
});
