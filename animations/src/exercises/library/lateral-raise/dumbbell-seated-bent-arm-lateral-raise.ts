// Sit upright with both feet flat and elbows held near a right angle beside the torso.
// Lift the bent arms laterally to shoulder height, then lower while the torso stays on the bench.
import type { FrontExercise } from '@/exercise.ts';
import { dumbbellLateral } from './_lateral-raise.ts';
export default dumbbellLateral({ id: 'dumbbell-seated-bent-arm-lateral-raise', name: '哑铃坐姿屈臂侧平举', en: 'Dumbbell Seated Bent-Arm Lateral Raise', sources: ['hz:2317'] }, { seated: true, bent: true }) satisfies FrontExercise;
