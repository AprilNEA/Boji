// Lie flat on the bench with the legs long beyond its end and the hands gripping the pad edges.
// Raise the nearly straight legs to a 90-degree angle, hold briefly, and lower them without swinging.
import type { SideExercise } from '@/exercise.ts';
import { flatBenchLegs } from './_core-flexion-1.ts';
export default flatBenchLegs({ id: 'flat-bench-lying-leg-raise', name: '平板凳仰卧举腿', meta: { en: 'Flat Bench Lying Leg Raise', family: 'core-flexion', equipment: ['bench'], sources: ['fe:Flat_Bench_Lying_Leg_Raise'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }] }) satisfies SideExercise;
