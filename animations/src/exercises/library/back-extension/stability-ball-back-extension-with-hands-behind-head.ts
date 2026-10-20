// Start with the hips on the stability ball, the feet braced on the wall and hands resting lightly behind the head.
// Extend the torso to the head-to-hip line while the neck remains long and the hands do not push the head.
import type { SideExercise } from '@/exercise.ts';
import { ballBackExtension } from './_back-extension.ts';

export default ballBackExtension({
  id: 'stability-ball-back-extension-with-hands-behind-head', name: '健身球抱头背伸',
  meta: { en: 'Stability Ball Back Extension with Hands Behind Head', family: 'back-extension', equipment: ['stability-ball', 'wall'], sources: ['hz:1334'] },
}, 'head') satisfies SideExercise;
