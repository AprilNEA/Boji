// Start tall with the hands on the hips and both feet under the body.
// Raise the advancing knee toward the chest, step into a deep lunge, then switch sides.
// The lead foot stays flat and the rear knee remains above the floor at the bottom.
import { sideLunge } from './_lunge-split-1.ts';

export default sideLunge({
  id: 'walking-high-knee-lunge', name: '高抬膝行走弓步', kind: 'forward', alternate: true, highKnee: true,
  meta: { en: 'Walking High-Knee Lunge', family: 'lunge-split', equipment: ['bodyweight'], sources: ['hz:3655'] },
});
