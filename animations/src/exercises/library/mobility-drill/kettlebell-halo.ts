// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'kettlebell-halo', name: '壶铃绕头', en: 'Kettlebell Halo', family: 'mobility-drill', equipment: ['kettlebell'], sources: ['fe:Kettlebell_Halo'],
}, 'halo', [{ m: 'delts', side: 'both' }, { m: 'traps', scale: 0.5 }, { m: 'abs', scale: 0.35 }]);
