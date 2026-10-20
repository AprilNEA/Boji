// Start flat with straight legs and arms alongside the body.
// Tuck the knees, extend the legs over the hips, then roll the pelvis up before returning to flat.
import type { SideExercise } from '@/exercise.ts';
import { reverseCrunch } from './_core-flexion-1.ts';
export default reverseCrunch({ id: 'bodyweight-reverse-crunch-to-hip-lift', name: '自重反向卷腹加举臀', meta: { en: 'Bodyweight Reverse Crunch to Hip Lift', family: 'core-flexion', equipment: ['bodyweight', 'mat'], sources: ['fe:Bottoms_Up'] }, muscles: [{ m: 'abs' }] }, { hipLift: true }) satisfies SideExercise;
