// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'dowel-shoulder-pass-through', name: '木棍肩部绕环', en: 'Dowel Shoulder Pass-Through', family: 'mobility-drill', equipment: ['other'], sources: ['fe:Chest_And_Front_Of_Shoulder_Stretch'],
}, 'dowel', [{ m: 'pecs' }, { m: 'delts', side: 'both', scale: 0.6 }]);
