// Begin with both hands close together on a stability ball and toes on the floor in a rigid plank.
// Bend the elbows beside the torso to lower toward the ball, then press back while controlling the unstable support.
import type { SideExercise } from '@/exercise.ts';
import { raisedSupport, stabilityBallSupport, supportPush, tricepsMuscles } from './_push-up-2.ts';

const center: [number, number] = [345, 378];
const S = raisedSupport([345, 310]);
export default supportPush({
  id: 'stability-ball-close-grip-push-up', name: '健身球窄距俯卧撑', en: 'Stability Ball Close-Grip Push-Up',
  equipment: ['bodyweight', 'stability-ball'], sources: ['hz:2328'], muscles: tricepsMuscles(), dynamic: stabilityBallSupport(center), propsBox: [277, 413],
}, S) satisfies SideExercise;
