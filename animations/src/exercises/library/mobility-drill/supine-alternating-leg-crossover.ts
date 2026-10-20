// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'supine-alternating-leg-crossover', name: '仰卧交替交叉摆腿', en: 'Supine Alternating Leg Crossover', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Windmills'],
}, 'supine-crossover', [{ m: 'abductors', side: 'near' }, { m: 'glutes', scale: 0.5 }, { m: 'hamstrings', side: 'both', scale: 0.35 }]);
