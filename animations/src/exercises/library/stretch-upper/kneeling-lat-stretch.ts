// Kneel with the toes pointed behind. Interlaced hands reach overhead as the trunk side-bends.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'kneeling-lat-stretch', name: '跪姿背阔肌拉伸', en: 'Kneeling Lat Stretch', equipment: ['bodyweight', 'mat'], sources: ['hz:1346'],
}, 'kneeling-lat', [{ m: 'lats', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.35, region: { view: 'front', part: 'upper', c: [0, 35], s: [11, 29], mirror: true } }]) satisfies FrontExercise;
