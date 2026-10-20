// Start in a long runner's lunge with both hands planted beside the front foot.
// The rear leg remains extended on its toes as the hips lift back to lengthen the front hamstring.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, runnersLunge } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'runners-lunge-stretch', name: '跑步弓步拉伸',
  meta: libraryMeta("Runner's Lunge Stretch", ['bodyweight'], ['fe:Runners_Stretch']),
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'calves', side: 'near', scale: 0.4 }, { m: 'hipFlexor', side: 'far', scale: 0.3 }],
  pose: runnersLunge,
}) satisfies SideExercise;
