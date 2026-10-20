// Behind-the-neck barbell push press, side view. The bar starts across the rear shoulders.
// A shallow straight-down knee dip drives the bar overhead, then the arms lock out. Feet remain planted.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'barbell-behind-the-neck-push-press',
  name: '杠铃颈后借力推举',
  meta: { en: 'Barbell Behind-the-Neck Push Press', equipment: ['barbell'], sources: ['fe:Push_Press_-_Behind_the_Neck'] },
  implement: 'barbell',
  rear: true,
  push: true,
});
