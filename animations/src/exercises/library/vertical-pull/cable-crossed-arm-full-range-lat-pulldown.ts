// Sit upright and hold the high cable handles with the opposite hands.
// Pull down in an arc as the arms uncross, then restore the crossed stretch.
import type { FrontExercise } from '@/exercise.ts';
import { frontPulldown } from './_vertical-pull-1.ts';

export default frontPulldown({
  id: 'cable-crossed-arm-full-range-lat-pulldown', name: '绳索交叉握全程高位下拉', en: 'Cable Crossed-Arm Full-Range Lat Pulldown',
  equipment: ['cable'], sources: ['fe:Full_Range-Of-Motion_Lat_Pulldown'],
}, { crossed: true }) satisfies FrontExercise;
