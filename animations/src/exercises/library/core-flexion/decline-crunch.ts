// Lie secured on a decline bench with the lower back pressed to the pad and hands light beside the head.
// Roll only the shoulders off the pad for a short abdominal curl, then lower without sitting upright.
import type { SideExercise } from '@/exercise.ts';
import { declineCore } from './_core-flexion-1.ts';
export default declineCore({ id: 'decline-crunch', name: '下斜卷腹', meta: { en: 'Decline Crunch', family: 'core-flexion', equipment: ['bench'], sources: ['fe:Decline_Crunch', 'hz:0277'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.3 }] }, { kind: 'crunch' }) satisfies SideExercise;
