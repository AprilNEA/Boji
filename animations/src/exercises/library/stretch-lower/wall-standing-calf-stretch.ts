// Wall standing calf stretch, side view. The stance is staggered with both hands supported on the wall.
// The front knee bends and the back leg stays straight from hip to grounded heel.
// The torso leans as one line toward the wall without a rounded back.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { A, G } from '@/exercises/common.ts';
import { stretchTL, wall } from './_stretch-lower-2.ts';

const tl = stretchTL;
export default {
  id: 'wall-standing-calf-stretch', name: '扶墙站姿小腿拉伸', tl,
  meta: { en: 'Wall Standing Calf Stretch', family: 'stretch-lower', equipment: ['bodyweight', 'wall'], sources: ['fe:Calf_Stretch_Hands_Against_Wall'] },
  muscles: [{ m: 'calves', side: 'far' }, { m: 'hamstrings', side: 'far', scale: 0.3 }], props: wall(425), propsBox: [190, 449],
  pose(t) {
    const p = tl.at(t).p;
    return { hip: [lerp(268, 294, p), lerp(258, 276, p)], spine: { lumbar: -60, thoracic: -62 }, neck: -63, head: -63,
      legs: { near: { target: [lerp(268, 360, p), G - A], side: [1, 0], foot: 0 }, far: { target: [lerp(265, 210, p), G - A], side: [1, 0], foot: 0 } },
      arms: { near: { target: [425, lerp(200, 230, p)], side: [0, 1], hand: 0 }, far: { target: [425, lerp(203, 233, p)], side: [0, 1], hand: 0 } },
    };
  },
} satisfies SideExercise;
