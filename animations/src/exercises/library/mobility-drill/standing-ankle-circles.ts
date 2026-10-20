// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'standing-ankle-circles', name: '站姿踝关节绕环', en: 'Standing Ankle Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Ankle_Circles'],
}, 'standing-ankle', [{ m: 'calves', side: 'near' }]);
