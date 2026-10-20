// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'standing-archer', name: '站姿弓箭手转体', en: 'Standing Archer', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['hz:3669'],
}, 'archer', [{ m: 'delts', side: 'both' }, { m: 'biceps', side: 'both', scale: 0.45 }]);
