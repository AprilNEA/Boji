// Sit upright on a flat bench and support the body by gripping its sides.
// Keep the knees straight and raise both legs to bench height, pause, then lower to the floor.
import type { SideExercise } from '@/exercise.ts';
import { seatedBench } from './_core-flexion-1.ts';
export default seatedBench({ id: 'bench-seated-leg-raise', name: '坐姿举腿', meta: { en: 'Bench Seated Leg Raise', family: 'core-flexion', equipment: ['bench'], sources: ['hz:0689'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.55 }] }, { kind: 'raise' }) satisfies SideExercise;
