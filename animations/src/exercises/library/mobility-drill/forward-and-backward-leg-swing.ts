// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'forward-and-backward-leg-swing', name: '前后摆腿', en: 'Forward and Backward Leg Swing', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Front_Leg_Raises'],
}, 'leg-swing', [{ m: 'hamstrings', side: 'near' }, { m: 'hipFlexor', side: 'near', scale: 0.45 }]);
