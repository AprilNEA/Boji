// Sit upright on the bench, stabilize a barbell across the thighs and keep both legs long.
// Lift the visible near leg toward parallel while the far leg remains grounded, then return before the other side moves.
import type { SideExercise } from '@/exercise.ts';
import { seatedBench } from './_core-flexion-1.ts';
export default seatedBench({ id: 'barbell-seated-alternating-leg-raise', name: '杠铃坐姿交替抬腿', meta: { en: 'Barbell Seated Alternating Leg Raise', family: 'core-flexion', equipment: ['barbell', 'bench'], sources: ['hz:2799', 'hz:2800'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'near', scale: 0.6 }, { m: 'quads', side: 'near', scale: 0.3 }] }, { kind: 'raise', barbell: true }) satisfies SideExercise;
