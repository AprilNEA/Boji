// Parallel-bar dip, side view. Both palms stay fixed on the bars while the suspended body remains controlled.
// The elbows lower to about 90° with crossed ankles behind the body, then extend to the supported top position.
import type { SideExercise } from '@/exercise.ts';
import { suspendedDip } from './_dip.ts';

export default suspendedDip({
  id: 'parallel-bar-dip', name: '双杠臂屈伸', en: 'Parallel Bar Dip', equipment: ['dip-station'],
  sources: ['fe:Parallel_Bar_Dip', 'hz:0672', 'hz:0251', 'hz:3289', 'hz:1767', 'hz:3288', 'hz:2462', 'hz:3313'],
}, 'regular') satisfies SideExercise;
