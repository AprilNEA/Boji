// Sit upright on the ball with both feet planted. Keep one upper arm near the ear as its dumbbell lowers behind the head.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'dumbbell-seated-single-arm-triceps-stretch-on-stability-ball', name: '哑铃健身球坐姿单臂肱三头肌拉伸', en: 'Dumbbell Seated Single-Arm Triceps Stretch on Stability Ball', equipment: ['dumbbell', 'stability-ball'], sources: ['hz:1745'],
}, 'ball-triceps', [{ m: 'triceps', side: 'near' }, { m: 'delts', side: 'near', scale: 0.35 }]) satisfies SideExercise;
