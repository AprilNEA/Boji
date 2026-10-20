// Start in a braced high plank with both hands on the top of one medicine ball.
// Keep the elbows close to the torso as the chest lowers, then press back through the ball to straight arms.
import type { SideExercise } from '@/exercise.ts';
import { medicineBallSupport, raisedSupport, supportPush, tricepsMuscles } from './_push-up-2.ts';

const center: [number, number] = [380, 418];
const S = raisedSupport([380, 390]);
export default supportPush({
  id: 'medicine-ball-close-grip-push-up', name: '药球窄距俯卧撑', en: 'Medicine Ball Close-Grip Push-Up',
  equipment: ['bodyweight', 'medicine-ball'], sources: ['hz:1701'], muscles: tricepsMuscles(), dynamic: medicineBallSupport(center), propsBox: [350, 410],
}, S) satisfies SideExercise;
