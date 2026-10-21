// Sit centered on a stability ball with both feet flat and knees near right angles.
// Hold a compact plate close to the chest and rotate the torso while keeping the hips facing forward.
// The ball remains under the pelvis, the feet stay grounded, and both hands keep the load stable.
import type { FrontExercise } from '@/exercise.ts';
import { GROUND } from '@/rig/side.ts';
import { BALL, heldPlate, stabilityBall } from '@/exercises/equipment/index.ts';
import { meanGrip, pairedHands, seated } from './_core-rotation-2.ts';

const swing = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'stability-ball-weighted-seated-twist', name: '健身球负重坐姿转体', view: 'front', tl: { total: 3.2 },
  meta: { en: 'Stability Ball Weighted Seated Twist', family: 'core-rotation', equipment: ['stability-ball', 'plate'], sources: ['hz:0849'] },
  muscles: [{ m: 'abs', e: () => 0.88 }, { m: 'obliques', scale: 0.8, e: () => 0.82 }],
  dynamic: [
    stabilityBall(() => ({ p: [0, GROUND - BALL.r] }), 'back'),
    heldPlate((J) => ({ p: meanGrip(J) }), 'face', 'small'),
  ],
  poster: 0.25,
  pose(t) {
    const u = swing(t);
    return { ...seated(34 * u), arms: pairedHands([56 * u, 186, 68]) };
  },
} satisfies FrontExercise;
