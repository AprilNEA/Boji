// Stand upright with the free hand fixed on a stable support and the dumbbell at the other side.
// Raise the working arm to shoulder height with no torso sway, then lower it slowly.
import type { FrontExercise } from '@/exercise.ts';
import { dumbbellLateral } from './_lateral-raise.ts';
export default dumbbellLateral({ id: 'dumbbell-supported-single-arm-lateral-raise', name: '哑铃支撑式单臂侧平举', en: 'Dumbbell Supported Single-Arm Lateral Raise', sources: ['hz:0356'] }, { unilateral: true, support: 'upright' }) satisfies FrontExercise;
