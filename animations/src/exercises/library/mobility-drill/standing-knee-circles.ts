// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'standing-knee-circles', name: '站姿膝关节绕环', en: 'Standing Knee Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['hz:0257'],
}, 'knee-circles', [{ m: 'calves' }, { m: 'quads', side: 'both', scale: 0.45 }]);
