// Start with the torso supported on the ball, feet braced and a medium plate held under the chin.
// Extend the trunk to neutral without swinging or hyperextending, while the plate travels with the chest.
import type { SideExercise } from '@/exercise.ts';
import { weightedBallBackExtension } from './_back-extension.ts';

export default weightedBallBackExtension({
  id: 'stability-ball-weighted-back-extension', name: '健身球负重背部伸展',
  meta: { en: 'Stability Ball Weighted Back Extension', family: 'back-extension', equipment: ['stability-ball', 'wall', 'plate'], sources: ['fe:Weighted_Ball_Hyperextension', 'hz:0835'] },
}) satisfies SideExercise;
