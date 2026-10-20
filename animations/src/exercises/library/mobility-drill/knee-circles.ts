// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'knee-circles', name: '膝关节绕环', en: 'Knee Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Knee_Circles'],
}, 'knees', [{ m: 'calves' }, { m: 'quads', side: 'both', scale: 0.5 }]);
