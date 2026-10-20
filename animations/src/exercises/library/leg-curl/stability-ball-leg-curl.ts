// Stability-ball leg curl, side view. The shoulders stay on the floor and the hips remain lifted in one line with the torso.
// Both heels rest on the ball at the start, then flex the knees to roll the ball toward the glutes.
// The ball stays in floor contact and follows the ankles; the pelvis stays elevated throughout the curl.
import type { SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math.ts';
import { A, FLOOR } from '@/exercises/common.ts';
import { BALL, stabilityBall, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.4);
const NECK: Vec2 = [102, FLOOR - 18];
const HIP = add(NECK, mul(dir(-31), 123.7));
// The ankle sits just above the top of the ball; the sole points along the ball surface.
const ankle = (t: number): Vec2 => [lerp(382, 275, tl.at(t).p), FLOOR - BALL.d + 5];
const ballCenter = (t: number): Vec2 => [ankle(t)[0] + 10, FLOOR - BALL.r];

export default {
  id: 'stability-ball-leg-curl',
  name: '健身球腿弯举',
  tl,
  meta: { en: 'Stability Ball Leg Curl', family: 'leg-curl', equipment: ['stability-ball'], sources: ['fe:Ball_Leg_Curl'] },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.65 }, { m: 'calves', side: 'both', scale: 0.3 }],
  dynamic: [stabilityBall((_J, t) => ({ p: ballCenter(t) }), 'back')],
  pose: (t) => {
    const a = ankle(t);
    return {
      hip: HIP,
      spine: { target: NECK, side: [0, 1] },
      neck: 182,
      head: 181,
      legs: {
        near: { target: a, foot: 0, side: [0, -1] },
        far: { target: [a[0] - 5, a[1] - 1], foot: 0, side: [0, -1] },
      },
      arms: { near: { a1: 8, a2: 1, hand: 0 }, far: { a1: 7, a2: 0, hand: 0 } },
    };
  },
} satisfies SideExercise;
