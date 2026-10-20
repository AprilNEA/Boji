// Start in a wide-toe high plank with the working hand directly under the shoulder.
// Keep the free hand behind the back while the supporting arm lowers and presses the rigid torso.
import type { SideExercise } from '@/exercise.ts';
import { singleArmPush } from './_push-up-2.ts';

export default singleArmPush({
  id: 'single-arm-push-up', name: '单臂俯卧撑', en: 'Single-Arm Push-Up',
  equipment: ['bodyweight'], sources: ['fe:Single-Arm_Push-Up'],
}) satisfies SideExercise;
