// Start tall with a barbell across the upper back and both feet under the body.
// Step forward into a deep lunge with an upright torso, then push through the lead heel to return.
// The lead foot stays flat and the rear knee remains above the floor.
import { sideLunge } from './_lunge-split-1.ts';

export default sideLunge({
  id: 'barbell-forward-lunge', name: '杠铃前跨弓步蹲', kind: 'forward', bar: true,
  meta: { en: 'Barbell Forward Lunge', family: 'lunge-split', equipment: ['barbell'], sources: ['fe:Barbell_Lunge'] },
});
