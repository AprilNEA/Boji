// Standing strap hamstring and calf stretch, side view. The front knee remains long and its toes lift.
// The back leg bends softly as the torso hinges toward the forward foot.
// Both hands pull a strap around the raised forefoot without rounding the spine.
import type { SideExercise } from '@/exercise.ts';
import type { Joints } from '@/rig/side.ts';
import { G } from '@/exercises/common.ts';
import { loopedStrap, stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
export default {
  id: 'strap-standing-hamstring-and-calf-stretch', name: '拉带站姿腘绳肌及小腿拉伸', tl,
  meta: { en: 'Strap Standing Hamstring and Calf Stretch', family: 'stretch-lower', equipment: ['other'], sources: ['fe:Standing_Hamstring_and_Calf_Stretch', 'hz:1599'] },
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'calves', side: 'near', scale: 0.5 }],
  dynamic: [...loopedStrap<Joints>((J) => [J.wrist_n, J.ankle_n, J.wrist_f])],
  pose(t) { const p = tl.at(t).p; return { hip: [282 - 20 * p, 264 + 7 * p], spine: { lumbar: -90 + 78 * p, thoracic: -90 + 76 * p }, neck: -90 + 76 * p, head: -88 + 73 * p,
    legs: { near: { target: [335, G - 13], foot: -30 * p, side: [1, 0] }, far: { target: [230, G - 13], foot: 0, side: [1, 0] } },
    arms: { near: { a1: 90 + 16 * p, a2: 90 + 16 * p, hand: 90 + 16 * p }, far: { a1: 92 + 17 * p, a2: 92 + 17 * p, hand: 92 + 17 * p } }, shoulderShift: 2 * p,
  }; },
} satisfies SideExercise;
