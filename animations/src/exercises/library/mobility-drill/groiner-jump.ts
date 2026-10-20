// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'groiner-jump', name: '俯撑开髋跳', en: 'Groiner Jump', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Groiners'],
}, 'groiner', [{ m: 'adductors', side: 'both' }, { m: 'hipFlexor', side: 'both', scale: 0.45 }]);
