// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'standing-pelvic-tilt', name: '站姿骨盆倾斜', en: 'Standing Pelvic Tilt', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Standing_Pelvic_Tilt', 'hz:1364'],
}, 'pelvic-tilt', [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.5 }, { m: 'abs', scale: 0.35 }]);
