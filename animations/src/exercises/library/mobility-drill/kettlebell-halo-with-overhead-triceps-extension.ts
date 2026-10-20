// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'kettlebell-halo-with-overhead-triceps-extension', name: '壶铃绕头接颈后臂屈伸', en: 'Kettlebell Halo with Overhead Triceps Extension', family: 'mobility-drill', equipment: ['kettlebell'], sources: ['fe:Kettlebell_Halo_With_Overhead_Extension'],
}, 'halo-extension', [{ m: 'delts', side: 'both' }, { m: 'abs', scale: 0.35 }]);
