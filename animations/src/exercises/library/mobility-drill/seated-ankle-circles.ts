// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'seated-ankle-circles', name: '坐姿踝关节绕环', en: 'Seated Ankle Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['hz:1368'],
}, 'seated-ankle', [{ m: 'calves', side: 'near' }]);
