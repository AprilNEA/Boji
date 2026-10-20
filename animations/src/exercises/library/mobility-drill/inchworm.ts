// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'inchworm', name: '毛毛虫爬行', en: 'Inchworm', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Inchworm', 'hz:1471', 'hz:3698'],
}, 'inchworm', [{ m: 'hamstrings', side: 'both' }, { m: 'abs', scale: 0.5 }, { m: 'delts', side: 'both', scale: 0.35 }]);
