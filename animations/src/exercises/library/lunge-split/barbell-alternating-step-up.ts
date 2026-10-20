// Start upright behind a stable step with a barbell across the upper back.
// Place one whole foot on the step, extend the hip and knee, then lower and switch sides.
// The bar stays over the upper back and both feet finish flat on the platform.
import { stepUp } from './_lunge-split-1.ts';

export default stepUp({
  id: 'barbell-alternating-step-up', name: '杠铃交替登阶', bar: true, alternate: true,
  meta: { en: 'Barbell Alternating Step-Up', family: 'lunge-split', equipment: ['barbell', 'step'], sources: ['hz:0114'] },
});
