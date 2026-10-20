// Rope-assisted standing quadriceps stretch, side view. The support foot stays under the body.
// The other knee flexes behind the hip, bringing the heel toward the glutes.
// One hand braces on a wall while the other holds the rope to the lifted ankle.
import type { SideExercise } from '@/exercise.ts';
import type { Joints } from '@/rig.ts';
import { strap, stretchTL, wall } from './_stretch-lower-2.ts';

const tl = stretchTL;
export default {
  id: 'rope-assisted-standing-hip-flexor-and-quadriceps-stretch', name: '绳辅助站姿髋屈肌股四头肌拉伸', tl,
  meta: { en: 'Rope-Assisted Standing Hip Flexor and Quadriceps Stretch', family: 'stretch-lower', equipment: ['rope', 'wall'], sources: ['hz:1564'] },
  muscles: [{ m: 'quads', side: 'far' }, { m: 'hipFlexor', side: 'far', scale: 0.4 }], props: wall(358), propsBox: [185, 382],
  dynamic: [strap<Joints>((J) => [J.wrist_n, J.ankle_f], 'Rope')],
  pose(t) { const p = tl.at(t).p; return { hip: [256, 255], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: { near: { a1: 90, a2: 90, foot: 0 }, far: { a1: 90, a2: 90 + 90 * p, foot: 180 * p } },
    arms: { near: { a1: 90 + 65 * p, a2: 90 + 65 * p, hand: 90 + 65 * p }, far: { target: [358, 220], side: [0, 1], hand: 0 } },
  }; },
} satisfies SideExercise;
