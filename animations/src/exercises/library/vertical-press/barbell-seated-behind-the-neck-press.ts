// Seated behind-the-neck barbell press, front view. The bar begins behind the head at shoulder level.
// Both arms press to a full overhead lockout and lower behind the head. The bench supports an upright torso.
import { frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'barbell-seated-behind-the-neck-press',
  name: '坐姿杠铃颈后推举',
  meta: { en: 'Barbell Seated Behind-the-Neck Press', equipment: ['barbell'], sources: ['hz:0086'] },
  implement: 'barbell',
  seated: true,
  rearBar: true,
});
