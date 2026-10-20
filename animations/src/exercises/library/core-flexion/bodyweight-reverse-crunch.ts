// Lie on the back with hands by the sides and bring the bent knees up from the mat.
// Curl the pelvis off the floor as the knees travel toward the chest, then lower slowly.
import type { SideExercise } from '@/exercise.ts';
import { reverseCrunch } from './_core-flexion-1.ts';
export default reverseCrunch({ id: 'bodyweight-reverse-crunch', name: '仰卧反向卷腹', meta: { en: 'Bodyweight Reverse Crunch', family: 'core-flexion', equipment: ['bodyweight', 'mat'], sources: ['hz:0138', 'hz:0870'] }, muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.3 }, { m: 'hipFlexor', side: 'both', scale: 0.3 }] }) satisfies SideExercise;
