// Start in a high plank and keep the supporting diagonal hand and toe planted on the mat.
// During each descent, lift the opposite arm and leg straight before alternating the diagonal support.
import type { SideExercise } from '@/exercise.ts';
import { supermanPush } from './_push-up-2.ts';

export default supermanPush({
  id: 'superman-push-up', name: '超人俯卧撑', en: 'Superman Push-Up',
  equipment: ['bodyweight'], sources: ['hz:0803'],
}) satisfies SideExercise;
