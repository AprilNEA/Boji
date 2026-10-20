// Bodyweight sliding leg curl, side view. The shoulders stay on the floor and the hips stay lifted in a bridge.
// Both heels slide inward from nearly straight knees to a tight curl while the soles stay in contact with the floor.
// The pelvis stays elevated and level; the arms lie beside the body for balance.
import type { SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math.ts';
import { A, FLOOR } from '@/exercises/common.ts';
import { workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.4);
const NECK: Vec2 = [120, FLOOR - 18];
const HIP = add(NECK, mul(dir(-32), 123.7));
// The extended heel is one pixel inside the 184 px combined leg reach.
const ankle = (t: number): Vec2 => [lerp(389, 286, tl.at(t).p), FLOOR - A];

export default {
  id: 'bodyweight-sliding-leg-curl',
  name: '自重滑动腿弯举',
  tl,
  meta: { en: 'Bodyweight Sliding Leg Curl', family: 'leg-curl', equipment: ['bodyweight'], sources: ['hz:0696'] },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.65 }, { m: 'calves', side: 'both', scale: 0.3 }],
  pose: (t) => {
    const a = ankle(t);
    return {
      hip: HIP,
      spine: { target: NECK, side: [0, 1] },
      neck: 182,
      head: 181,
      legs: {
        near: { target: a, foot: 0, side: [0, -1] },
        far: { target: [a[0] - 5, a[1]], foot: 0, side: [0, -1] },
      },
      arms: { near: { a1: 8, a2: 1, hand: 0 }, far: { a1: 7, a2: 0, hand: 0 } },
    };
  },
} satisfies SideExercise;
