// Lie with feet planted and hands light behind the head so the neck stays relaxed.
// Curl the shoulder blades up at a normal speed, then make the lowering phase visibly slower and controlled.
import type { SideExercise } from '@/exercise.ts';
import { floorCrunch } from './_core-flexion-1.ts';
export default floorCrunch({ id: 'eccentric-crunch', name: '离心卷腹', meta: { en: 'Eccentric Crunch', family: 'core-flexion', equipment: ['bodyweight', 'mat'], sources: ['hz:0634'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.25 }] }, { eccentric: true }) satisfies SideExercise;
