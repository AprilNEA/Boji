// Standing behind-the-neck barbell press, side view. The bar starts on the upper back below the neck.
// Both arms press to an overhead lockout and lower to the rear shoulders. The knees and torso remain still.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'barbell-standing-behind-the-neck-press',
  name: '站姿杠铃颈后推举',
  meta: { en: 'Barbell Standing Behind-the-Neck Press', equipment: ['barbell'], sources: ['fe:Standing_Barbell_Press_Behind_Neck', 'hz:0788'] },
  implement: 'barbell',
  rear: true,
});
