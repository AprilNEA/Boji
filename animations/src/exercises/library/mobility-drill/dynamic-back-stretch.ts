// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'dynamic-back-stretch', name: '背部动态拉伸', en: 'Dynamic Back Stretch', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Dynamic_Back_Stretch'],
}, 'back-stretch', [{ m: 'lats' }, { m: 'delts', side: 'both', scale: 0.35 }]);
