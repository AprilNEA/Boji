// Start with one bell low and hinge through the hips and knees.
// Drive it overhead, then receive it in a split stance with the elbow locked before recovering.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_kettlebell-ballistic.ts';

export default snatch({ id: 'kettlebell-single-arm-split-snatch', name: '壶铃单臂分腿抓举', en: 'Kettlebell Single-Arm Split Snatch', sources: ['fe:One-Arm_Kettlebell_Split_Snatch'] }, false, true) satisfies SideExercise;
