// Lie back on a flat bench with the shoulders supported and the legs extending beyond its end.
// Keep the legs together and long as they rise to vertical, then lower without arching away from the bench.
import type { SideExercise } from '@/exercise.ts';
import { flatBenchLegs } from './_core-flexion-1.ts';
export default flatBenchLegs({ id: 'bench-lying-leg-raise', name: '平凳仰卧举腿', meta: { en: 'Bench Lying Leg Raise', family: 'core-flexion', equipment: ['bench'], sources: ['hz:0620'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }] }) satisfies SideExercise;
