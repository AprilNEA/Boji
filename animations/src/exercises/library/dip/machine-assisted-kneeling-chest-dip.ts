// Assisted kneeling chest dip, side view. Knees stay on the counterweight pad and hands keep the machine handles.
// The torso leans forward as the elbows bend to parallel-upper-arm depth, then presses back to support.
import type { SideExercise } from '@/exercise.ts';
import { assistedMachineDip } from './_dip.ts';

export default assistedMachineDip({
  id: 'machine-assisted-kneeling-chest-dip', name: '器械辅助跪姿双杠臂屈伸', en: 'Machine Assisted Kneeling Chest Dip', equipment: ['machine'],
  sources: ['hz:0009', 'hz:2364'],
}, 'chest') satisfies SideExercise;
