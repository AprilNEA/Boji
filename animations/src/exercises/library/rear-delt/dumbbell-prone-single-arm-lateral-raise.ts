// Lie chest-down on a flat bench and brace the free hand on the bench leg for stability.
// Keep the loaded arm long with a soft elbow as it lifts sideways to shoulder height and returns.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-prone-single-arm-lateral-raise', name: '哑铃俯卧单臂侧平举',
  en: 'Dumbbell Prone Single-Arm Lateral Raise', sources: ['fe:Lying_One-Arm_Lateral_Raise'],
}, { support: 'flat', unilateral: true }) satisfies FrontExercise;
