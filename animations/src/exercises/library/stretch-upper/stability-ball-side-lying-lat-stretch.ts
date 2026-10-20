// Lie sideways with the head and side supported by the ball. Reach the upper arm overhead.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'stability-ball-side-lying-lat-stretch', name: '健身球侧卧背阔肌拉伸', en: 'Stability Ball Side-Lying Lat Stretch', equipment: ['stability-ball', 'mat'], sources: ['hz:1342'],
}, 'ball-side-lying-lat', [{ m: 'lats', side: 'both' }, { m: 'obliques', scale: 0.35 }]) satisfies SideExercise;
