// Stand tall with relaxed shoulders. The hand gently guides the ear toward that shoulder.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'bodyweight-assisted-lateral-neck-stretch', name: '手辅助颈侧屈拉伸', en: 'Bodyweight Assisted Lateral Neck Stretch', equipment: ['bodyweight'], sources: ['hz:0716'],
}, 'neck-assisted', [{ m: 'neck' }, { m: 'traps', scale: 0.35 }]) satisfies FrontExercise;
