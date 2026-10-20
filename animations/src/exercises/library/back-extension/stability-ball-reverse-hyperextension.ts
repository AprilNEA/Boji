// Start prone with the hips resting on the stability ball and hands planted on the floor in front for support.
// Keep the torso stable as the straight legs lift to torso level, then lower without lumbar overextension.
import type { SideExercise } from '@/exercise.ts';
import { ballReverseHyper } from './_back-extension.ts';

export default ballReverseHyper({
  id: 'stability-ball-reverse-hyperextension', name: '瑞士球反向挺身',
  meta: { en: 'Stability Ball Reverse Hyperextension', family: 'back-extension', equipment: ['stability-ball'], sources: ['hz:0675'] },
}) satisfies SideExercise;
