// Start in a hip hinge with one hand on the bell.
// Extend the hips and rotate the bell smoothly into a close shoulder rack. The free hand stays clear.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_kettlebell-ballistic.ts';

export default clean({ id: 'kettlebell-single-arm-clean', name: '壶铃单臂翻铃', en: 'Kettlebell Single-Arm Clean', sources: ['fe:One-Arm_Kettlebell_Clean'] }, 'single') satisfies SideExercise;
