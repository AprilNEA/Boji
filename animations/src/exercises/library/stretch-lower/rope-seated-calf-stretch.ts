// Seated rope calf stretch, side view. The near leg lies straight in front of the hips.
// Both hands pull a rope over the ball of that foot to flex the ankle.
// The far leg remains extended to make the seated position stable and clear.
import type { SideExercise } from '@/exercise.ts';
import { FLOOR } from '@/exercises/common.ts';
import type { Joints } from '@/rig/side.ts';
import { loopedStrap, stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
export default {
  id: 'rope-seated-calf-stretch', name: '绳索坐姿小腿拉伸', tl, mat: true,
  meta: { en: 'Rope Seated Calf Stretch', family: 'stretch-lower', equipment: ['rope', 'mat'], sources: ['hz:1388', 'hz:1389'] },
  muscles: [{ m: 'calves', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.35 }],
  dynamic: [...loopedStrap<Joints>((J) => [J.wrist_n, J.ankle_n, J.wrist_f], 'Rope')],
  pose(t) { const p = tl.at(t).p; return { hip: [188, FLOOR - 26], spine: { lumbar: -92 + 20 * p, thoracic: -92 + 20 * p }, neck: -90 + 20 * p, head: -90 + 20 * p,
    legs: { near: { a1: 0, a2: 0, foot: -72 }, far: { a1: 0, a2: 0, foot: 0 } },
    arms: { near: { a1: 42, a2: 42, hand: 42 }, far: { a1: 45, a2: 45, hand: 45 } },
  }; },
} satisfies SideExercise;
