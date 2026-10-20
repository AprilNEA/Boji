// Arms remain level while the wrists trace full circles; the trunk stays quiet.
// The movement returns to its start without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'arm-circles', name: '手臂绕环', en: 'Arm Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Arm_Circles'],
}, 'arm-circles', [{ m: 'delts' }, { m: 'traps', scale: 0.35 }]);
