// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'wrist-circles', name: '手腕绕环', en: 'Wrist Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Wrist_Circles', 'hz:1428'],
}, 'wrist', [{ m: 'forearms', side: 'both' }]);
