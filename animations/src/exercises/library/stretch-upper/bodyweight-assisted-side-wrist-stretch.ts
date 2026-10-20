// One straight arm reaches sideways at shoulder height. The opposite hand draws its wrist inward.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'bodyweight-assisted-side-wrist-stretch', name: '侧向拉腕拉伸', en: 'Bodyweight Assisted Side Wrist Stretch', equipment: ['bodyweight'], sources: ['hz:0721'],
}, 'side-wrist', [{ m: 'forearms', side: 'both' }]) satisfies FrontExercise;
