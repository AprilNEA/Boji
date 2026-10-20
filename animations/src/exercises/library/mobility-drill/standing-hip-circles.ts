// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'standing-hip-circles', name: '站姿髋关节绕环', en: 'Standing Hip Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Standing_Hip_Circles'],
}, 'hip-circles', [{ m: 'abductors', side: 'l' }, { m: 'adductors', side: 'l', scale: 0.45 }]);
