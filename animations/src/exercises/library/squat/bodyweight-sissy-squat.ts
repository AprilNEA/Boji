// Bodyweight sissy squat, side view. The knees advance while the straight torso and hips lean back as one unit.
// The heels rise while the toes stay down, the arms counterbalance in front, and the knees extend to a tall start.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { A, G, toesDown } from '@/exercises/common.ts';
import { squatTL, X0 } from './_squat-2.ts';

const tl = squatTL(0.35);
export default {
  id: 'bodyweight-sissy-squat', name: '自重西西深蹲', tl,
  meta: { en: 'Bodyweight Sissy Squat', family: 'squat', equipment: ['bodyweight'], sources: ['hz:1489'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.35 }, { m: 'glutes', scale: 0.25 }],
  pose(t) {
    const p = tl.at(t).p;
    const heel = 22 * p;
    const ankleY = G - A - heel;
    return {
      hip: [lerp(X0 - 2, X0 - 25, p), lerp(G - A - 183.9, G - A - 139, p)],
      spine: { lumbar: lerp(-90, -125, p), thoracic: lerp(-90, -125, p) },
      neck: lerp(-89, -125, p), head: lerp(-89, -125, p),
      legs: {
        near: { target: [X0, ankleY], foot: toesDown(A + heel), side: [1, 0] },
        far: { target: [X0 - 5, ankleY], foot: toesDown(A + heel), side: [1, 0] },
      },
      arms: {
        near: { a1: lerp(45, 24, p), a2: lerp(15, 8, p), hand: 8 },
        far: { a1: lerp(48, 27, p), a2: lerp(18, 10, p), hand: 10 },
      },
    };
  },
} satisfies SideExercise;
