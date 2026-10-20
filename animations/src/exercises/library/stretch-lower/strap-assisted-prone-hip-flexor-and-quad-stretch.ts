// Strap-assisted prone hip-flexor and quadriceps stretch, side view. The person lies face down.
// The working knee bends and hip extends so the lifted foot travels toward the head.
// Both hands pull the strap above the back while the supporting leg stays long.
import type { SideExercise } from '@/exercise.ts';
import type { Joints } from '@/rig.ts';
import { FLOOR } from '@/exercises/common.ts';
import { strap, stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
export default {
  id: 'strap-assisted-prone-hip-flexor-and-quad-stretch', name: '拉伸带辅助俯卧髋屈肌及股四头肌拉伸', tl, mat: true,
  meta: { en: 'Strap-Assisted Prone Hip Flexor and Quad Stretch', family: 'stretch-lower', equipment: ['other', 'mat'], sources: ['fe:Intermediate_Hip_Flexor_and_Quad_Stretch'] },
  muscles: [{ m: 'quads', side: 'near' }, { m: 'hipFlexor', side: 'near', scale: 0.45 }],
  dynamic: [strap<Joints>((J) => [J.wrist_n, J.ankle_n])],
  pose(t) { const p = tl.at(t).p; return { hip: [160, FLOOR - 28], spine: { lumbar: 1, thoracic: 1 }, neck: 0, head: 0,
    legs: { near: { a1: -15 * p, a2: 180 + 20 * p, foot: 180 }, far: { a1: 0, a2: 0, foot: 0 } },
    arms: { near: { a1: 178, a2: 178, hand: 178 }, far: { a1: 175, a2: 175, hand: 175 } },
  }; },
} satisfies SideExercise;
