// Assisted kneeling triceps dip, side view. Knees stay supported by the counterweight pad and hands hold the handles.
// The back remains upright as the elbows bend beside the torso, then extend to the supported top.
import type { SideExercise } from '@/exercise.ts';
import { assistedMachineDip } from './_dip.ts';

export default assistedMachineDip({
  id: 'machine-assisted-kneeling-triceps-dip', name: '器械辅助跪姿肱三头肌双杠臂屈伸', en: 'Machine Assisted Kneeling Triceps Dip', equipment: ['machine'],
  sources: ['hz:0019'],
}, 'triceps') satisfies SideExercise;
