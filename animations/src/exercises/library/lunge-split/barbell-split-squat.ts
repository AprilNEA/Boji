// Start in a fixed staggered stance with the barbell across the upper back.
// Lower until the front thigh is parallel, then drive through the front heel to rise.
// The front foot stays flat, the rear heel remains raised and the bar stays over the upper back.
import { sideLunge } from './_lunge-split-1.ts';

export default sideLunge({
  id: 'barbell-split-squat', name: '杠铃分腿蹲', kind: 'split', bar: true,
  meta: { en: 'Barbell Split Squat', family: 'lunge-split', equipment: ['barbell'], sources: ['hz:0099', 'hz:2810'] },
});
