// Standing toe touch, side view. The knees stay softly bent while the hips fold and the back stays long.
// Both hands travel toward the toes and pause low on the shins.
// Feet remain flat and parallel for the full range.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { G } from '@/exercises/common.ts';
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
      // The feet stay planted. The hips move back over the heels and stay high, so the knees only soften.
      hip: [lerp(266, 238, p), lerp(256, 261, p)],
      spine: { lumbar: lerp(-90, 15, p), thoracic: lerp(-90, 12, p) },
      neck: lerp(-90, 16, p), head: lerp(-88, 22, p),
      legs: {
        near: { target: [268, G - 13], foot: 0, side: [1, 0] },
        far: { target: [262, G - 13], foot: 0, side: [1, 0] },
      },
      arms: {
        near: { a1: lerp(90, 112, p), a2: lerp(90, 112, p), hand: lerp(90, 112, p) },
        far: { a1: lerp(92, 114, p), a2: lerp(92, 114, p), hand: lerp(92, 114, p) },
      },
    };
  },
} satisfies SideExercise;
