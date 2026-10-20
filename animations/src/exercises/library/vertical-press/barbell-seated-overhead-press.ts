// Seated barbell overhead press, side view. The bar starts at the front shoulder level with the elbows bent.
// The arms press overhead to lockout and return to the shoulders. The torso remains upright and the feet are flat.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'barbell-seated-overhead-press',
  name: '坐姿杠铃肩上推举',
  meta: { en: 'Barbell Seated Overhead Press', equipment: ['barbell', 'bench'], sources: ['hz:0091'] },
  implement: 'barbell',
  seated: true,
});
