// Standing toe-touch stretch, side view. The legs are long and the upper body relaxes into a hip fold.
// The arms hang freely toward the ankles instead of pulling the body lower.
// Both feet remain flat and the neck follows the spine.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;

export default {
  id: 'standing-toe-touch-stretch',
  name: '站姿体前屈拉伸',
  tl,
  meta: { en: 'Standing Toe Touch Stretch', family: 'stretch-lower', equipment: ['bodyweight'], sources: ['fe:Standing_Toe_Touches'] },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'calves', side: 'both', scale: 0.4 }],
  pose(t) {
    const p = tl.at(t).p;
    return {
      hip: [lerp(264, 267, p), 255],
      spine: { lumbar: lerp(-90, -4, p), thoracic: lerp(-90, -8, p) },
      neck: lerp(-90, -11, p), head: lerp(-88, -12, p),
      legs: {
        near: { a1: 90, a2: 90, foot: 0 },
        far: { a1: 90, a2: 90, foot: 0 },
      },
      arms: {
        near: { a1: lerp(90, 110, p), a2: lerp(90, 110, p), hand: lerp(90, 104, p) },
        far: { a1: lerp(92, 112, p), a2: lerp(92, 112, p), hand: lerp(92, 106, p) },
      },
    };
  },
} satisfies SideExercise;
