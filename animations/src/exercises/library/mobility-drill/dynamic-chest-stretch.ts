// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'dynamic-chest-stretch', name: '动态胸部拉伸', en: 'Dynamic Chest Stretch', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Dynamic_Chest_Stretch', 'hz:1167'],
}, 'chest', [{ m: 'pecs' }, { m: 'delts', scale: 0.4 }]);
