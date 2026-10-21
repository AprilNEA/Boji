// Supine calf stretch, side view. One knee stays bent with the foot on the floor.
// Both hands pull the toes of the long leg back toward the shin.
// The head and pelvis remain relaxed on the mat during the hold.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { FLOOR } from '@/exercises/common.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const HIP: [number, number] = [272, FLOOR - 26];
export default {
  id: 'supine-calf-stretch', name: '仰卧小腿拉伸', tl, mat: true,
  meta: { en: 'Supine Calf Stretch', family: 'stretch-lower', equipment: ['bodyweight', 'mat'], sources: ['hz:1708'] },
  muscles: [{ m: 'calves', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.35 }],
  pose(t) {
    const p = tl.at(t).p;
    return { hip: HIP, spine: { lumbar: 178, thoracic: 178 }, neck: 181, head: 181,
      legs: { near: { a1: lerp(0, -4, p), a2: lerp(0, -4, p), foot: lerp(0, -64, p) }, far: { a1: -45, a2: 72, foot: 0 } },
      arms: { near: { a1: lerp(8, 4, p), a2: lerp(2, -4, p), hand: lerp(2, -64, p) }, far: { a1: lerp(10, 6, p), a2: lerp(4, -2, p), hand: lerp(4, -64, p) } },
    };
  },
} satisfies SideExercise;
