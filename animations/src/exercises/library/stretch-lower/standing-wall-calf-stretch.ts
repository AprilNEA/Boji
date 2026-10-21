// Standing wall calf stretch, side view. Both palms brace on the wall at shoulder height.
// The front knee bends while the rear leg stays long with its heel pressed down.
// Head, hip and rear heel remain in one long diagonal line.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { A, G } from '@/exercises/common.ts';
import { stretchTL, wall } from './_stretch-lower-2.ts';

const tl = stretchTL;
export default {
  id: 'standing-wall-calf-stretch', name: '站姿扶墙小腿拉伸', tl,
  meta: { en: 'Standing Wall Calf Stretch', family: 'stretch-lower', equipment: ['bodyweight', 'wall'], sources: ['hz:1407', 'hz:1377', 'hz:1398'] },
  muscles: [{ m: 'calves', side: 'far' }, { m: 'hamstrings', side: 'far', scale: 0.35 }], props: wall(425), propsBox: [190, 449],
  pose(t) {
    const p = tl.at(t).p;
    return { hip: [lerp(268, 294, p), lerp(258, 276, p)], spine: { lumbar: -60, thoracic: -62 }, neck: -63, head: -63,
      legs: { near: { target: [lerp(268, 360, p), G - A], side: [1, 0], foot: 0 }, far: { target: [lerp(265, 210, p), G - A], side: [1, 0], foot: 0 } },
      arms: { near: { target: [425, lerp(200, 230, p)], side: [0, 1], hand: 0 }, far: { target: [425, lerp(203, 233, p)], side: [0, 1], hand: 0 } },
    };
  },
} satisfies SideExercise;
