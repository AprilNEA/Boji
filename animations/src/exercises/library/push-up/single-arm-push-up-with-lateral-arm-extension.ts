// Start in a high plank with one hand under the shoulder and the other arm held out from the body.
// The supporting arm performs the push-up while the extended arm and the feet stay clear of the floor motion.
import type { SideExercise } from '@/exercise.ts';
import { singleArmPush } from './_push-up-2.ts';

export default singleArmPush({
  id: 'single-arm-push-up-with-lateral-arm-extension', name: '单臂俯卧撑加侧伸臂',
  en: 'Single-Arm Push-Up with Lateral Arm Extension', equipment: ['bodyweight'], sources: ['hz:0666'],
}, true) satisfies SideExercise;
