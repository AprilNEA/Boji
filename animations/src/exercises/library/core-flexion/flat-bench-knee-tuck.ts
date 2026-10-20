// Lie on a flat bench with the legs extended beyond the pad and the hands holding its edges.
// Bend both knees and pull the thighs toward the midsection, then return to a straight-leg start.
import type { SideExercise } from '@/exercise.ts';
import { flatBenchLegs } from './_core-flexion-1.ts';
export default flatBenchLegs({ id: 'flat-bench-knee-tuck', name: '平板凳仰卧收膝', meta: { en: 'Flat Bench Knee Tuck', family: 'core-flexion', equipment: ['bench'], sources: ['fe:Flat_Bench_Leg_Pull-In'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.45 }] }, { tuck: true }) satisfies SideExercise;
