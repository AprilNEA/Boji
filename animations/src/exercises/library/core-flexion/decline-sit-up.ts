// Lie secured on a decline bench with bent knees and the hands held lightly beside the head.
// Curl the torso all the way toward the thighs, pause, then lower along the bench in control.
import type { SideExercise } from '@/exercise.ts';
import { declineCore } from './_core-flexion-1.ts';
export default declineCore({ id: 'decline-sit-up', name: '下斜仰卧起坐', meta: { en: 'Decline Sit-Up', family: 'core-flexion', equipment: ['bench'], sources: ['hz:0282'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.45 }, { m: 'lowerBack', scale: 0.3 }] }, { kind: 'situp' }) satisfies SideExercise;
