// Seated band shoulder press, side view. The resistance band runs from beneath the planted feet to both hands.
// The hands press from shoulder height to an overhead lockout. The torso stays upright on the bench.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'band-seated-shoulder-press',
  name: '坐姿弹力带肩上推举',
  meta: { en: 'Band Seated Shoulder Press', equipment: ['band', 'bench'], sources: ['hz:3122'] },
  implement: 'band',
  seated: true,
});
