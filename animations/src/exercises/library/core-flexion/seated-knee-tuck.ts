// Sit near the edge of a bench with hands supporting the body and feet initially on the floor.
// Lean back slightly, extend the legs off the ground, then bend both knees back toward the body.
import type { SideExercise } from '@/exercise.ts';
import { seatedBench } from './_core-flexion-1.ts';
export default seatedBench({ id: 'seated-knee-tuck', name: '坐姿收膝', meta: { en: 'Seated Knee Tuck', family: 'core-flexion', equipment: ['bench'], sources: ['hz:0555'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.4 }, { m: 'hamstrings', side: 'both', scale: 0.3 }] }, { kind: 'kickout' }) satisfies SideExercise;
