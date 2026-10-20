// Start flexed over a stability ball with the hips supported and the feet braced against a wall.
// Keep the legs fixed as the torso extends only to a straight line from the head to the heels.
import type { SideExercise } from '@/exercise.ts';
import { ballBackExtension } from './_back-extension.ts';

export default ballBackExtension({
  id: 'stability-ball-back-extension', name: '健身球背部伸展',
  meta: { en: 'Stability Ball Back Extension', family: 'back-extension', equipment: ['stability-ball', 'wall'], sources: ['hz:1314'] },
}) satisfies SideExercise;
