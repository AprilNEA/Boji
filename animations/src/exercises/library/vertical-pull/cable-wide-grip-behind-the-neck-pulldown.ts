// Sit beneath the wide bar with the thighs held below the pad.
// Keep the head forward and draw the bar behind the neck before returning overhead.
import type { FrontExercise } from '@/exercise.ts';
import { frontPulldown } from './_vertical-pull-1.ts';

export default frontPulldown({
  id: 'cable-wide-grip-behind-the-neck-pulldown', name: '绳索宽握颈后下拉', en: 'Cable Wide-Grip Behind-the-Neck Pulldown',
  equipment: ['cable'], sources: ['fe:Wide-Grip_Pulldown_Behind_The_Neck'],
}, { wide: true, behindNeck: true }) satisfies FrontExercise;
