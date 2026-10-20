// Use an overhand grip on one high bar. Keep the feet supported while the hanging arm takes most weight.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'single-arm-supported-hanging-lat-stretch', name: '单臂支撑悬垂拉伸', en: 'Single-Arm Supported Hanging Lat Stretch', equipment: ['pull-up-bar'], sources: ['fe:One_Handed_Hang'],
}, 'supported-hang', [{ m: 'lats', side: 'near' }, { m: 'biceps', side: 'near', scale: 0.35 }]) satisfies SideExercise;
