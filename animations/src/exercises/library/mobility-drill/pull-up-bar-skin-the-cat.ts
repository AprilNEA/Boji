// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'pull-up-bar-skin-the-cat', name: '单杠翻肩', en: 'Pull-Up Bar Skin the Cat', family: 'mobility-drill', equipment: ['pull-up-bar'], sources: ['hz:3304'],
}, 'skin-cat', [{ m: 'upperBack' }, { m: 'delts', side: 'both', scale: 0.55 }, { m: 'abs', scale: 0.5 }]);
