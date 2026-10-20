// Lie flat with arms beside the body, knees bent near 75 degrees and feet hovering above the mat.
// Draw the knees toward the chest and roll the pelvis up, then lower without straightening the knees.
import type { SideExercise } from '@/exercise.ts';
import { reverseCrunch } from './_core-flexion-1.ts';
export default reverseCrunch({ id: 'bent-knee-reverse-crunch', name: '屈膝反向卷腹', meta: { en: 'Bent-Knee Reverse Crunch', family: 'core-flexion', equipment: ['bodyweight', 'mat'], sources: ['fe:Bent-Knee_Hip_Raise'] }, muscles: [{ m: 'abs' }] }) satisfies SideExercise;
