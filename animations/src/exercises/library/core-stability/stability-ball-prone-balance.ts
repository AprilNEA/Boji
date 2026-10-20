// Lie face down with the abdomen centered on the stability ball and hands on the mat.
// Extend both elbows and lift the straight legs behind the body without moving the ball.
// Hold the balanced position with the knees straight and the hips level.
import type { SideExercise } from '@/exercise.ts';
import { BALL, stabilityBall } from '@/exercises/equipment/index.ts';
import { G } from '@/exercises/common.ts';
import { holdWave, proneBallBalancePose } from './_core-stability-2.ts';

export default {
  id: 'stability-ball-prone-balance', name: '瑞士球俯卧平衡', tl: { total: 4 },
  meta: { en: 'Stability Ball Prone Balance', family: 'core-stability', equipment: ['stability-ball'], sources: ['fe:Downward_Facing_Balance'] },
  muscles: [
    { m: 'glutes', e: (t) => 0.8 + 0.1 * holdWave(t) }, { m: 'abs', scale: 0.58, e: () => 0.62 },
    { m: 'hamstrings', side: 'both', scale: 0.45, e: () => 0.5 },
  ],
  dynamic: [stabilityBall(() => ({ p: [280, G - BALL.r] }), 'back')], propsBox: [190, 445], poster: 0.25,
  pose: () => proneBallBalancePose(),
} satisfies SideExercise;
