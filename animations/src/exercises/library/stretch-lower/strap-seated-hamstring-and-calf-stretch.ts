// Seated strap hamstring and calf stretch, side view. Both legs extend along the floor.
// The torso hinges forward slightly while the strap draws one forefoot back.
// The spine stays long and the rope remains visibly connected to the near foot.
import type { SideExercise } from '@/exercise.ts';
import { FLOOR } from '@/exercises/common.ts';
import type { Joints } from '@/rig.ts';
import { loopedStrap, stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
export default {
  id: 'strap-seated-hamstring-and-calf-stretch', name: '拉伸带坐姿腘绳肌小腿拉伸', tl, mat: true,
  meta: { en: 'Strap Seated Hamstring and Calf Stretch', family: 'stretch-lower', equipment: ['other', 'mat'], sources: ['fe:Seated_Hamstring_and_Calf_Stretch'] },
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'calves', side: 'near', scale: 0.5 }],
  dynamic: [...loopedStrap<Joints>((J) => [J.wrist_n, J.ankle_n, J.wrist_f])],
  pose(t) { const p = tl.at(t).p; return { hip: [188, FLOOR - 26], spine: { lumbar: -92 + 25 * p, thoracic: -92 + 25 * p }, neck: -90 + 25 * p, head: -90 + 25 * p,
    legs: { near: { a1: 0, a2: 0, foot: -72 }, far: { a1: 0, a2: 0, foot: 0 } },
    arms: { near: { a1: 42, a2: 42, hand: 42 }, far: { a1: 45, a2: 45, hand: 45 } },
  }; },
} satisfies SideExercise;
