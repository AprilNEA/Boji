// Rope-assisted supine hamstring stretch, side view. The raised leg stays straight with its foot flexed.
// The other leg remains extended on the mat to keep the pelvis stable.
// Both hands hold a taut rope that loops over the ball of the foot.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { FLOOR } from '@/exercises/common.ts';
import type { Joints } from '@/rig.ts';
import { loopedStrap, stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const HIP: [number, number] = [272, FLOOR - 26];
export default {
  id: 'rope-supine-hamstring-stretch', name: '绳索仰卧腘绳肌拉伸', tl, mat: true,
  meta: { en: 'Rope Supine Hamstring Stretch', family: 'stretch-lower', equipment: ['rope', 'mat'], sources: ['hz:1582'] },
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'calves', side: 'near', scale: 0.35 }, { m: 'glutes', side: 'near', scale: 0.3 }],
  dynamic: [...loopedStrap<Joints>((J) => [J.wrist_n, J.ankle_n, J.wrist_f], 'Rope')],
  pose(t) { const p = tl.at(t).p; return { hip: HIP, spine: { lumbar: 178, thoracic: 178 }, neck: 181, head: 181,
    legs: { near: { a1: lerp(0, -92, p), a2: lerp(0, -92, p), foot: -75 * p }, far: { a1: 0, a2: 0, foot: 0 } },
    arms: { near: { a1: lerp(8, -42, p), a2: lerp(2, -42, p), hand: lerp(2, -42, p) }, far: { a1: lerp(10, -39, p), a2: lerp(4, -39, p), hand: lerp(4, -39, p) } },
  }; },
} satisfies SideExercise;
