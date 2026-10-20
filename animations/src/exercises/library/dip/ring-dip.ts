// Ring dip, side view. Each hand holds a suspended ring while the torso remains controlled above the anchors.
// The elbows lower past 90° without a swing, then extend to the stable supported top position.
import type { SideExercise } from '@/exercise.ts';
import { suspendedDip } from './_dip.ts';

export default suspendedDip({
  id: 'ring-dip', name: '吊环臂屈伸', en: 'Ring Dip', equipment: ['other'],
  sources: ['fe:Ring_Dips', 'hz:0677'],
}, 'regular', 'rings') satisfies SideExercise;
