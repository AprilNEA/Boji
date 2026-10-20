// Single-arm kettlebell military press, front view. The working bell starts at one shoulder with the elbow flared out.
// The arm presses vertically to overhead lockout and returns under control. The free arm stays relaxed.
import { frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'kettlebell-single-arm-military-press-to-the-side',
  name: '壶铃单臂侧向军用推举',
  meta: { en: 'Kettlebell Single-Arm Military Press to the Side', equipment: ['kettlebell'], sources: ['hz:0539'] },
  implement: 'kettlebell',
  unilateral: 'l',
  style: 'side',
});
