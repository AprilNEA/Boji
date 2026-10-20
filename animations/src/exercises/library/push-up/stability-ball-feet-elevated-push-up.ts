// Start in a high plank with the toes balanced on top of a stability ball and hands on the floor.
// Keep the body long while lowering the chest, then press through the palms without allowing the ball to roll away.
import type { SideExercise } from '@/exercise.ts';
import { elevatedFeetPush, stabilityBallSupport } from './_push-up-2.ts';

export default elevatedFeetPush({
  id: 'stability-ball-feet-elevated-push-up', name: '健身球下斜俯卧撑', en: 'Stability Ball Feet-Elevated Push-Up',
  equipment: ['bodyweight', 'stability-ball'], sources: ['fe:Push-Ups_With_Feet_On_An_Exercise_Ball'], dynamic: stabilityBallSupport([154, 378]), propsBox: [86, 432],
}, [154, 269]) satisfies SideExercise;
