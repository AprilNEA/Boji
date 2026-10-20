// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'quadruped-hip-circles', name: '四点支撑髋关节绕环', en: 'Quadruped Hip Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Hip_Circles_prone'],
}, 'quad-hip', [{ m: 'abductors', side: 'near' }, { m: 'adductors', side: 'near', scale: 0.45 }]);
