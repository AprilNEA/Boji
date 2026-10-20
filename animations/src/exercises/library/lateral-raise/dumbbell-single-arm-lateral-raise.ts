// Stand tall with one dumbbell at the side and the free arm relaxed by the opposite thigh.
// Raise the working arm laterally to shoulder height without leaning, then lower it slowly.
import type { FrontExercise } from '@/exercise.ts';
import { dumbbellLateral } from './_lateral-raise.ts';
export default dumbbellLateral({ id: 'dumbbell-single-arm-lateral-raise', name: '哑铃单臂侧平举', en: 'Dumbbell Single-Arm Lateral Raise', sources: ['hz:0355'] }, { unilateral: true }) satisfies FrontExercise;
