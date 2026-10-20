// Sit with thighs secured and hold the bar in a wide overhand grip.
// The source directs the bar to the upper chest, so this uses a front pulldown path.
import type { FrontExercise } from '@/exercise.ts';
import { frontPulldown } from './_vertical-pull-1.ts';

export default frontPulldown({
  id: 'cable-wide-grip-behind-the-neck-lat-pulldown', name: '绳索宽握高位下拉', en: 'Cable Wide-Grip Behind-the-Neck Lat Pulldown',
  equipment: ['cable'], sources: ['hz:1325'],
}, { wide: true }) satisfies FrontExercise;
