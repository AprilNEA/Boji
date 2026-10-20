// Start on the hip pad with the feet secured and the arms crossed before the chest.
// Lower the straight back by hinging at the waist, then raise only until the trunk matches the legs.
import type { SideExercise } from '@/exercise.ts';
import { romanBackExtension } from './_back-extension.ts';

export default romanBackExtension({
  id: 'bench-back-extension', name: '罗马椅背部挺身',
  meta: { en: 'Bench Back Extension', family: 'back-extension', equipment: ['bench'], sources: ['hz:0489', 'hz:0488'] },
}) satisfies SideExercise;
