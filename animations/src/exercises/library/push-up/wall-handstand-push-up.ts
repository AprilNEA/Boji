// Kick into a vertical handstand with the heels touching the wall and hands at shoulder width.
// Lower the head between the hands by bending the elbows, then press to a straight-arm inversion.
import type { SideExercise } from '@/exercise.ts';
import { wallHandstand } from './_push-up-2.ts';

export default wallHandstand({
  id: 'wall-handstand-push-up', name: '靠墙倒立俯卧撑', en: 'Wall Handstand Push-Up',
  equipment: ['bodyweight', 'wall'], sources: ['hz:0471', 'fe:Handstand_Push-Ups'],
}) satisfies SideExercise;
