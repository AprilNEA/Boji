// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'standing-two-hand-toe-touch', name: '站姿双手触脚尖', en: 'Standing Two-Hand Toe Touch', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['hz:3231'],
}, 'toe-touch', [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.55 }, { m: 'lowerBack', scale: 0.35 }]);
