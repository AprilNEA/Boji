// Start prone on a flat bench with the hips at the edge, hands holding the front edge and legs hanging straight.
// Keep the knees locked as both legs lift to torso level, squeeze the glutes, then lower slowly.
import type { SideExercise } from '@/exercise.ts';
import { benchReverseHyper } from './_back-extension.ts';

export default benchReverseHyper({
  id: 'bench-reverse-hyperextension', name: '平凳反向挺身',
  meta: { en: 'Bench Reverse Hyperextension', family: 'back-extension', equipment: ['bench'], sources: ['hz:1423'] },
}) satisfies SideExercise;
