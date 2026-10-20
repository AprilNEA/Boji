// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'shoulder-circles', name: '肩部绕环', en: 'Shoulder Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Shoulder_Circles'],
}, 'shoulder-circles', [{ m: 'delts', side: 'both' }, { m: 'traps', scale: 0.45 }]);
