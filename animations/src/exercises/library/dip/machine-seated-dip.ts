// Seated machine dip, side view. The back stays on the pad, feet remain flat, and the elbows stay near the sides.
// The handles press downward from an elbow bend near 90° to a controlled near-straight bottom position.
import type { SideExercise } from '@/exercise.ts';
import { seatedMachineDip } from './_dip.ts';

export default seatedMachineDip({
  id: 'machine-seated-dip', name: '坐姿器械臂屈伸', en: 'Machine Seated Dip', equipment: ['machine'],
  sources: ['fe:Dip_Machine', 'hz:1451', 'hz:0591'],
}) satisfies SideExercise;
