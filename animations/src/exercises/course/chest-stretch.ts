// 开胸拉伸 (chest-stretch). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { A, G, standLegs } from '@/exercises/common.ts';

const chestTL = timeline([
  { d: 1.8, from: 0, to: 1, ease: 'sine', e: [0.1, 1] },
  { d: 1.6, from: 1, to: 1, e: [1, 1] },
  { d: 1.4, from: 1, to: 0, ease: 'sine', e: [1, 0.1] },
  { d: 0.6, from: 0, to: 0, e: [0.1, 0.1] },
]);
const chestStretch = {
  id: 'chest-stretch', name: '开胸拉伸', tl: chestTL,
  muscles: [{ m: 'pecs' }, { m: 'delts', side: 'near', scale: 0.7 }],
  pose(t) {
    const { p } = chestTL.at(t);
    const x0 = 268;
    return {
      hip: [x0 - 6, G - A - 181],
      spine: { lumbar: lerp(-89, -86, p), thoracic: lerp(-91, -101, p) },
      neck: lerp(-87, -83, p), head: lerp(-90, -93, p),
      shoulderShift: lerp(0, 4, p),
      legs: standLegs(x0),
      arms: {
        near: { a1: lerp(92, 131, p), a2: lerp(87, 127, p), hand: lerp(90, 124, p) },
        far: { a1: lerp(93, 127, p), a2: lerp(88, 124, p), hand: lerp(90, 121, p) },
      },
    };
  },
} satisfies Exercise;

export default chestStretch;
