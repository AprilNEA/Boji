// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'clasped-hands-circular-toe-touch', name: '双手交握环绕触脚', en: 'Clasped-Hands Circular Toe Touch', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['hz:3218'],
}, 'clasp-toe', [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.6 }]);
