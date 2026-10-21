// Strap-assisted supine hamstring stretch, side view. The working hip is near ninety degrees.
// Its knee stays long while the opposite leg remains flat on the mat.
// Both hands pull the strap from the raised forefoot toward the chest.
import type { SideExercise } from '@/exercise.ts';
import { FLOOR } from '@/exercises/common.ts';
import type { Joints } from '@/rig/side.ts';
import { loopedStrap, stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const HIP: [number, number] = [272, FLOOR - 26];
export default {
  id: 'strap-assisted-supine-hamstring-stretch', name: '仰卧拉带辅助腘绳肌拉伸', tl, mat: true,
  meta: { en: 'Strap-Assisted Supine Hamstring Stretch', family: 'stretch-lower', equipment: ['other', 'mat'], sources: ['fe:Hamstring_Stretch'] },
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'calves', side: 'near', scale: 0.35 }],
  dynamic: [...loopedStrap<Joints>((J) => [J.wrist_n, J.ankle_n, J.wrist_f])],
  pose(t) { const p = tl.at(t).p; return { hip: HIP, spine: { lumbar: 178, thoracic: 178 }, neck: 181, head: 181,
    legs: { near: { a1: -92, a2: -92, foot: -75 }, far: { a1: 0, a2: 0, foot: 0 } },
    arms: { near: { a1: -42, a2: -42, hand: -42 }, far: { a1: -39, a2: -39, hand: -39 } },
    shoulderShift: 2 * p,
  }; },
} satisfies SideExercise;
