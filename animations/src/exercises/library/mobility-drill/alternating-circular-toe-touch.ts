// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'alternating-circular-toe-touch', name: '交替绕环触脚尖', en: 'Alternating Circular Toe Touch', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['hz:3214'],
}, 'alternating-toe', [{ m: 'glutes', side: 'near' }, { m: 'hamstrings', side: 'both', scale: 0.55 }]);
