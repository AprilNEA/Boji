// Hold a fixed support with the free hand and lean slightly toward the working arm.
// The dumbbell arm raises laterally to shoulder height while the supporting hand remains fixed.
import type { FrontExercise } from '@/exercise.ts';
import { dumbbellLateral } from './_lateral-raise.ts';
export default dumbbellLateral({ id: 'dumbbell-single-arm-lean-away-lateral-raise', name: '哑铃单臂倾斜侧平举', en: 'Dumbbell Single-Arm Lean-Away Lateral Raise', sources: ['fe:One-Arm_Side_Laterals'] }, { unilateral: true, support: 'lean-away' }) satisfies FrontExercise;
