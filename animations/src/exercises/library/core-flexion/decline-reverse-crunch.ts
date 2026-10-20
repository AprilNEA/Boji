// Lie on a decline bench with both hands holding the top of the bench and straight legs held parallel to the floor.
// Roll the pelvis back as the knees draw toward the torso, then return the legs to the parallel starting line.
import type { SideExercise } from '@/exercise.ts';
import { declineReverseCrunch } from './_core-flexion-1.ts';
export default declineReverseCrunch({ id: 'decline-reverse-crunch', name: '下斜反向卷腹', meta: { en: 'Decline Reverse Crunch', family: 'core-flexion', equipment: ['bench'], sources: ['fe:Decline_Reverse_Crunch'] }, muscles: [{ m: 'abs' }] }) satisfies SideExercise;
