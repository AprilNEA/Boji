// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'running-claw-drill', name: '跑步扒地练习', en: 'Running Claw Drill', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Moving_Claw_Series'],
}, 'claw', [{ m: 'hamstrings', side: 'near' }, { m: 'calves', side: 'both', scale: 0.5 }, { m: 'quads', side: 'both', scale: 0.4 }]);
