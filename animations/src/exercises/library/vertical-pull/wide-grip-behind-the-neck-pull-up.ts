// Hang from the wide bar with the head slightly forward of the hands.
// Pull upward until the bar reaches behind the neck, then lower under control.
import type { FrontExercise } from '@/exercise.ts';
import { frontPullUp } from './_vertical-pull-1.ts';

export default frontPullUp({
  id: 'wide-grip-behind-the-neck-pull-up', name: '宽握颈后引体向上', en: 'Wide-Grip Behind-the-Neck Pull-Up',
  equipment: ['pull-up-bar'], sources: ['fe:Wide-Grip_Rear_Pull-Up', 'hz:1367'],
}, { wide: true, behindNeck: true }) satisfies FrontExercise;
