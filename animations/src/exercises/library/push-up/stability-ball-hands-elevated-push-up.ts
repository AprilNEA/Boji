// Begin with shoulder-width hands on the top of a stability ball and toes grounded behind the body.
// Keep the trunk straight as the chest lowers toward the ball, then press to straight arms while balancing the support.
import type { SideExercise } from '@/exercise.ts';
import { raisedSupport, stabilityBallSupport, supportPush } from './_push-up-2.ts';

const center: [number, number] = [345, 378];
const S = raisedSupport([345, 310]);
export default supportPush({
  id: 'stability-ball-hands-elevated-push-up', name: '健身球撑手俯卧撑', en: 'Stability Ball Hands-Elevated Push-Up',
  equipment: ['bodyweight', 'stability-ball'], sources: ['hz:0655', 'hz:0656'], dynamic: stabilityBallSupport(center), propsBox: [277, 413],
}, S) satisfies SideExercise;
