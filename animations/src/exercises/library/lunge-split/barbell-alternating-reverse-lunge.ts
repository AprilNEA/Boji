// Start tall with a barbell across the upper back and both feet under the body.
// Step one foot back onto the toes, lower into a lunge, then drive through the front heel and switch sides.
// The bar stays over the upper back and the rear knee stops above the floor.
import { sideLunge } from './_lunge-split-1.ts';

export default sideLunge({
  id: 'barbell-alternating-reverse-lunge', name: '杠铃交替后撤箭步蹲', kind: 'reverse', alternate: true, bar: true,
  meta: { en: 'Barbell Alternating Reverse Lunge', family: 'lunge-split', equipment: ['barbell'], sources: ['hz:0078', 'hz:0077'] },
});
