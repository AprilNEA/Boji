// Standing military press, side view. The bar lowers to the collarbone while the torso stays tall.
// Both arms press the bar overhead to a controlled lockout. The knees do not dip and the feet stay planted.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'barbell-standing-military-press',
  name: '站姿杠铃军用推举',
  meta: { en: 'Barbell Standing Military Press', equipment: ['barbell'], sources: ['fe:Standing_Military_Press'] },
  implement: 'barbell',
});
