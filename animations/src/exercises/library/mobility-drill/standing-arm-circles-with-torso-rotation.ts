// This drill keeps a stable standing base while the named joint moves through its full controlled range.
// The loop returns to the same neutral posture without shifting the planted feet.
import { frontDrill } from './_mobility-drill.ts';

export default frontDrill({
  id: 'standing-arm-circles-with-torso-rotation', name: '站姿转体绕臂', en: 'Standing Arm Circles with Torso Rotation', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['hz:3318'],
}, 'arm-torso', [{ m: 'delts', side: 'both' }, { m: 'abs', scale: 0.45 }, { m: 'obliques', scale: 0.45 }]);
