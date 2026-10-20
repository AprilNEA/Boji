// Start flexed over the ball with the hips supported, feet braced against the wall and arms reaching forward.
// Raise the straight arms and torso as one unit until the body is aligned, then lower under control.
import type { SideExercise } from '@/exercise.ts';
import { ballBackExtension } from './_back-extension.ts';

export default ballBackExtension({
  id: 'stability-ball-back-extension-with-arms-extended', name: '健身球直臂背伸',
  meta: { en: 'Stability Ball Back Extension with Arms Extended', family: 'back-extension', equipment: ['stability-ball', 'wall'], sources: ['hz:1333'] },
}, 'extended') satisfies SideExercise;
