// Strap side-lying quadriceps stretch, side view. The lower leg lies long as a stable base.
// The top knee bends behind the body, moving the heel toward the glutes.
// A strap travels from the lifted foot over the shoulder to the hands.
import type { SideExercise } from '@/exercise.ts';
import type { Joints } from '@/rig/side.ts';
import { FLOOR } from '@/exercises/common.ts';
import { loopedStrap, stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
export default {
  id: 'strap-side-lying-quadriceps-stretch', name: '拉伸带侧卧股四头肌拉伸', tl, mat: true,
  meta: { en: 'Strap Side-Lying Quadriceps Stretch', family: 'stretch-lower', equipment: ['other', 'mat'], sources: ['fe:Quad_Stretch'] },
  muscles: [{ m: 'quads', side: 'near' }],
  dynamic: [...loopedStrap<Joints>((J) => [J.wrist_n, J.ankle_n, J.wrist_f])],
  pose(t) { const p = tl.at(t).p; return { hip: [186, FLOOR - 27], spine: { lumbar: 0, thoracic: 0 }, neck: 0, head: 0,
    legs: { near: { a1: -10 * p, a2: 180 + 15 * p, foot: 180 }, far: { a1: 0, a2: 0, foot: 0 } },
    arms: { near: { a1: 174, a2: 174, hand: 174 }, far: { a1: 170, a2: 170, hand: 170 } },
  }; },
} satisfies SideExercise;
