// Sit on a stability ball with feet flat and hinge forward while both upper arms stay fixed.
// Extend both dumbbells backward from bent elbows, then return under control without moving the torso.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellKickback } from './_triceps-extension-2.ts';

export default dumbbellKickback({
  id: 'dumbbell-seated-stability-ball-triceps-kickback', name: '哑铃健身球坐姿臂屈伸', ball: true,
  meta: { en: 'Dumbbell Seated Stability Ball Triceps Kickback', family: 'triceps-extension', equipment: ['dumbbell', 'stability-ball'], sources: ['hz:1734'] },
}) satisfies SideExercise;
