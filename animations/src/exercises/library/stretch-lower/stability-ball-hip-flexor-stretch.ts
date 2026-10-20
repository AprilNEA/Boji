// Stability-ball hip-flexor stretch, side view. The front foot rests on top of the ball.
// The rear leg extends behind the pelvis as the hips travel gently forward.
// The torso stays tall and both hands remain on the hips.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { G, handOnHip } from '@/exercises/common.ts';
import { BALL, stabilityBall } from '@/exercises/equipment/index.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const BALL_C: [number, number] = [356, G - BALL.r];
export default {
  id: 'stability-ball-hip-flexor-stretch', name: '健身球髋屈肌拉伸', tl,
  meta: { en: 'Stability Ball Hip Flexor Stretch', family: 'stretch-lower', equipment: ['stability-ball'], sources: ['hz:1559'] },
  muscles: [{ m: 'hipFlexor', side: 'far' }, { m: 'quads', side: 'far', scale: 0.45 }, { m: 'glutes', scale: 0.3 }],
  dynamic: [stabilityBall(() => ({ p: BALL_C }))], propsBox: [135, 424],
  pose(t) { const p = tl.at(t).p; return { hip: [lerp(255, 276, p), lerp(274, 283, p)], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: { near: { target: [356, G - BALL.d], foot: 0, side: [1, 0] }, far: { target: [184, G - 13], foot: 0, side: [-1, 0] } },
    arms: { near: handOnHip(0), far: handOnHip(-5) },
  }; },
} satisfies SideExercise;
