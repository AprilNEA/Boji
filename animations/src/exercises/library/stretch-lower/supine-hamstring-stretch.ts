// Supine hamstring stretch, side view. One thigh rises toward the chest and the knee then lengthens.
// Both hands support the raised thigh while the opposite leg remains extended.
// The pelvis and head stay on the mat for the full static hold.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { FLOOR } from '@/exercises/common.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const HIP: [number, number] = [272, FLOOR - 26];
export default {
  id: 'supine-hamstring-stretch', name: '仰卧腘绳肌拉伸', tl, mat: true,
  meta: { en: 'Supine Hamstring Stretch', family: 'stretch-lower', equipment: ['bodyweight', 'mat'], sources: ['hz:1576'] },
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'glutes', side: 'near', scale: 0.35 }],
  pose(t) {
    const p = tl.at(t).p;
    return { hip: HIP, spine: { lumbar: 178, thoracic: 178 }, neck: 181, head: 181,
      legs: { near: { a1: lerp(0, -105, p), a2: lerp(0, -90, p), foot: 0 }, far: { a1: 0, a2: 0, foot: 0 } },
      arms: { near: { a1: lerp(8, -30, p), a2: lerp(2, -30, p), hand: lerp(2, -30, p) }, far: { a1: lerp(10, -27, p), a2: lerp(4, -27, p), hand: lerp(4, -27, p) } },
    };
  },
} satisfies SideExercise;
