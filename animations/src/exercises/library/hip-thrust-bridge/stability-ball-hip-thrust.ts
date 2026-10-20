// Start with the upper back resting on a stability ball and both feet flat on the floor.
// Extend the hips upward into a bridge while keeping the ball behind the upper back.
// Both feet stay planted and the shoulders keep controlled contact with the ball.
import type { SideExercise } from '@/exercise.ts';
import { BALL, stabilityBall } from '@/exercises/equipment/index.ts';
import { G } from '@/exercises/common.ts';
import { ballSupportArms, hipThrustPose, bridgeTL } from './_hip-thrust-bridge.ts';

const tl = bridgeTL();

export default {
  id: 'stability-ball-hip-thrust', name: '瑞士球臀推', tl,
  meta: { en: 'Stability Ball Hip Thrust', family: 'hip-thrust-bridge', equipment: ['stability-ball'], sources: ['fe:Physioball_Hip_Bridge'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.6 }],
  dynamic: [stabilityBall(() => ({ p: [106, G - BALL.r] }), 'back')],
  propsBox: [38, 404],
  pose: (t) => hipThrustPose(tl.at(t).p, ballSupportArms),
} satisfies SideExercise;
