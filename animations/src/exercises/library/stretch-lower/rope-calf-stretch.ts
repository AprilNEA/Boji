// Rope calf stretch, side view. The back leg stays straight with its heel grounded.
// The front foot rests forward with its forefoot looped by a rope.
// The torso leans forward and both hands maintain gentle rope tension.
import type { SideExercise } from '@/exercise.ts';
import type { Joints } from '@/rig.ts';
import { loopedStrap, stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
export default {
  id: 'rope-calf-stretch', name: '绳辅助小腿拉伸', tl,
  meta: { en: 'Rope Calf Stretch', family: 'stretch-lower', equipment: ['rope'], sources: ['hz:1378'] },
  muscles: [{ m: 'calves', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.35 }],
  dynamic: [...loopedStrap<Joints>((J) => [J.wrist_n, J.ankle_n, J.wrist_f], 'Rope')],
  pose(t) { const p = tl.at(t).p; return { hip: [258, 255 + 30 * p], spine: { lumbar: -90 + 78 * p, thoracic: -90 + 76 * p }, neck: -90 + 76 * p, head: -88 + 73 * p,
    legs: { near: { a1: 90 - 28 * p, a2: 90 - 28 * p, foot: -65 * p }, far: { a1: 90 + 46 * p, a2: 90 - 38 * p, foot: 0 } },
    arms: { near: { a1: 90 + 16 * p, a2: 90 + 16 * p, hand: 90 + 16 * p }, far: { a1: 92 + 17 * p, a2: 92 + 17 * p, hand: 92 + 17 * p } },
  }; },
} satisfies SideExercise;
