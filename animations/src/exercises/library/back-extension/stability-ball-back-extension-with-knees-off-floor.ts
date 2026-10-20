// Start flexed over the ball with straight legs, knees clear of the floor and the feet braced against a wall.
// Keep the knees extended as the torso rises to a neutral head-to-heel line and returns smoothly.
import type { SideExercise } from '@/exercise.ts';
import { ballBackExtension } from './_back-extension.ts';

export default ballBackExtension({
  id: 'stability-ball-back-extension-with-knees-off-floor', name: '健身球膝离地背伸',
  meta: { en: 'Stability Ball Back Extension with Knees Off Floor', family: 'back-extension', equipment: ['stability-ball', 'wall'], sources: ['hz:1335'] },
}) satisfies SideExercise;
