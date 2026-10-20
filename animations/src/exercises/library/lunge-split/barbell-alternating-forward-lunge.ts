// Start tall with a barbell across the upper back and both feet under the body.
// Step forward into a deep lunge, drive through the lead heel and switch sides.
// The bar stays over the upper back, the lead foot stays flat and the rear knee stays above the floor.
import { sideLunge } from './_lunge-split-1.ts';

export default sideLunge({
  id: 'barbell-alternating-forward-lunge', name: '杠铃交替前弓步', kind: 'forward', alternate: true, bar: true,
  meta: { en: 'Barbell Alternating Forward Lunge', family: 'lunge-split', equipment: ['barbell'], sources: ['hz:0054'] },
});
