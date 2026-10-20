// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'elbow-circles', name: '肘部绕环', en: 'Elbow Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Elbow_Circles'],
}, 'elbow', [{ m: 'delts' }, { m: 'traps', scale: 0.35 }]);
