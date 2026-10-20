// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'standing-lateral-leg-swing', name: '站姿侧向摆腿', en: 'Standing Lateral Leg Swing', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Side_Leg_Raises'],
}, 'lateral-swing', [{ m: 'adductors', side: 'l' }, { m: 'abductors', side: 'l', scale: 0.65 }]);
