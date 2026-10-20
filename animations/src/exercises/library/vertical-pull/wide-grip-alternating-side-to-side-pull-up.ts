// Hang from the wide bar without swinging the torso or legs.
// Raise the chest toward one hand, return to the hang, then pull to the other.
import type { FrontExercise } from '@/exercise.ts';
import { frontPullUp } from './_vertical-pull-1.ts';

export default frontPullUp({
  id: 'wide-grip-alternating-side-to-side-pull-up', name: '宽握交替左右引体向上', en: 'Wide-Grip Alternating Side-to-Side Pull-Up',
  equipment: ['pull-up-bar'], sources: ['fe:Side_To_Side_Chins'],
}, { alternate: true, wide: true }) satisfies FrontExercise;
