// Forearm-supported wall calf stretch, side view. Both forearms take the weight against a wall.
// The body leans forward while both heels stay visibly planted behind the hips.
// Knees remain long, so the posture reads as a bilateral calf stretch.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { A, G } from '@/exercises/common.ts';
import { stretchTL, wall } from './_stretch-lower-2.ts';

const tl = stretchTL;
export default {
  id: 'wall-forearm-supported-calf-stretch', name: '扶墙前臂支撑小腿拉伸', tl,
  meta: { en: 'Wall Forearm-Supported Calf Stretch', family: 'stretch-lower', equipment: ['bodyweight', 'wall'], sources: ['fe:Calf_Stretch_Elbows_Against_Wall'] },
  muscles: [{ m: 'calves', side: 'both' }], props: wall(414), propsBox: [200, 438],
  pose(t) {
    const p = tl.at(t).p;
    return { hip: [lerp(270, 280, p), 260], spine: { lumbar: lerp(-70, -58, p), thoracic: lerp(-72, -60, p) }, neck: lerp(-72, -63, p), head: lerp(-72, -63, p),
      legs: { near: { target: [lerp(270, 250, p), G - A], side: [1, 0], foot: 0 }, far: { target: [lerp(267, 244, p), G - A], side: [1, 0], foot: 0 } },
      arms: { near: { a1: lerp(55, 11, p), a2: lerp(-35, 90, p), hand: lerp(-35, 90, p) }, far: { a1: lerp(57, 13, p), a2: lerp(-33, 90, p), hand: lerp(-33, 90, p) } },
    };
  },
} satisfies SideExercise;
