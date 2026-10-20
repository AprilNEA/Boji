// Sit forward on an incline bench with the working upper arm braced against the inside thigh.
// Raise the soft-elbow working arm laterally to shoulder height, then return it under control.
import type { FrontExercise } from '@/exercise.ts';
import { dumbbellLateral } from './_lateral-raise.ts';
export default dumbbellLateral({ id: 'dumbbell-single-arm-incline-lateral-raise', name: '哑铃单臂上斜侧平举', en: 'Dumbbell Single-Arm Incline Lateral Raise', sources: ['hz:0323'] }, { seated: true, incline: true, unilateral: true, lowCross: true }) satisfies FrontExercise;
