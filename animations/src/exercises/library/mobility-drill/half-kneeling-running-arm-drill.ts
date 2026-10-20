// This drill uses the source start position and makes the instructed moving limb visible from the side.
// Ground and hand contacts stay fixed whenever the source requires them.
import { sideDrill } from './_mobility-drill.ts';

export default sideDrill({
  id: 'half-kneeling-running-arm-drill', name: '半跪姿跑步摆臂练习', en: 'Half-Kneeling Running Arm Drill', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Kneeling_Arm_Drill'],
}, 'half-kneel-arms', [{ m: 'delts', side: 'both' }, { m: 'abs', scale: 0.4 }]);
