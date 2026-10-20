// Stand with soft knees and hinge forward with a neutral back. Roll the foam roller away while both hands stay on it.
// The stretch eases into a long hold, returns to neutral, and keeps both feet planted.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'foam-roller-standing-lat-stretch', name: '泡沫轴站姿背阔肌拉伸', en: 'Foam Roller Standing Lat Stretch', equipment: ['foam-roller'], sources: ['hz:2207'],
}, 'roller-standing-lat', [{ m: 'lats', side: 'both' }, { m: 'delts', side: 'both', scale: 0.35 }, { m: 'triceps', side: 'both', scale: 0.3 }]) satisfies SideExercise;
