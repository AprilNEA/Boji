// Sit on a flat bench, lean back about 45 degrees and hold both bench edges for support.
// Pull the knees in while the torso comes toward them, pause, then extend the legs and lean back again.
import type { SideExercise } from '@/exercise.ts';
import { seatedBench } from './_core-flexion-1.ts';
export default seatedBench({ id: 'bench-seated-knee-tuck', name: '平凳坐姿收膝', meta: { en: 'Bench Seated Knee Tuck', family: 'core-flexion', equipment: ['bench'], sources: ['fe:Seated_Flat_Bench_Leg_Pull-In', 'fe:Seated_Leg_Tucks', 'hz:0570'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.45 }] }, { kind: 'tuck' }) satisfies SideExercise;
