// Standing toe touch, side view. The knees stay softly bent while the hips fold and the back stays long.
// Both hands travel toward the toes and pause low on the shins.
// Feet remain flat and parallel for the full range.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;

export default {
  id: 'standing-toe-touch',
  name: '站姿体前屈摸脚尖',
  tl,
  meta: { en: 'Standing Toe Touch', family: 'stretch-lower', equipment: ['bodyweight'], sources: ['hz:3212'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.55 }, { m: 'calves', side: 'both', scale: 0.3 }],
  pose(t) {
    const p = tl.at(t).p;
    return {
      hip: [lerp(266, 270, p), lerp(255, 269, p)],
      spine: { lumbar: lerp(-90, -8, p), thoracic: lerp(-90, -11, p) },
      neck: lerp(-90, -13, p), head: lerp(-88, -14, p),
      legs: {
        near: { a1: lerp(90, 78, p), a2: lerp(90, 60, p), foot: 0 },
        far: { a1: lerp(90, 120, p), a2: lerp(90, 75, p), foot: 0 },
      },
      arms: {
        near: { a1: lerp(90, 110, p), a2: lerp(90, 110, p), hand: lerp(90, 104, p) },
        far: { a1: lerp(92, 112, p), a2: lerp(92, 112, p), hand: lerp(92, 106, p) },
      },
    };
  },
} satisfies SideExercise;
