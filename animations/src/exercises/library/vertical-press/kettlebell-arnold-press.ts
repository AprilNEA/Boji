// Standing kettlebell Arnold press, front view. Both bells start racked at shoulder level with bent elbows.
// The arms press overhead to lockout and return to the rack position. The feet remain flat.
import { type PressInfo, frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'kettlebell-arnold-press',
  name: '站姿壶铃阿诺德推举',
  meta: { en: 'Kettlebell Arnold Press', equipment: ['kettlebell'], sources: ['hz:0523'] },
  implement: 'kettlebell',
  style: 'arnold',
});
