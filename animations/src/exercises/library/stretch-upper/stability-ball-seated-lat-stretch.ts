// Sit upright with both feet planted on the floor. One arm reaches overhead as the trunk leans away.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { FrontExercise } from '@/exercise.ts';
import { frontUpper } from './_stretch-upper.ts';

export default frontUpper({
  id: 'stability-ball-seated-lat-stretch', name: '健身球坐姿背阔肌拉伸', en: 'Stability Ball Seated Lat Stretch', equipment: ['stability-ball'], sources: ['hz:1339'],
}, 'ball-seated-lat', [{ m: 'lats', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.35, region: { view: 'front', part: 'upper', c: [0, 35], s: [11, 29], mirror: true } }]) satisfies FrontExercise;
