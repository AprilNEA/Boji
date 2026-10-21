// Supine single-leg hamstring stretch, side view. One foot stays planted to stabilize the pelvis.
// The other leg extends up toward the face with its knee as long as comfortable.
// The arms reach toward the lifted leg without lifting the head or shoulders.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { FLOOR } from '@/exercises/common.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const HIP: [number, number] = [272, FLOOR - 26];
export default {
  id: 'supine-single-leg-hamstring-stretch', name: '仰卧单腿腘绳肌拉伸', tl, mat: true,
  meta: { en: 'Supine Single-Leg Hamstring Stretch', family: 'stretch-lower', equipment: ['bodyweight', 'mat'], sources: ['fe:Leg-Up_Hamstring_Stretch'] },
  muscles: [{ m: 'hamstrings', side: 'near' }],
  pose(t) {
    const p = tl.at(t).p;
    return { hip: HIP, spine: { lumbar: 178, thoracic: 178 }, neck: 181, head: 181,
      legs: { near: { a1: lerp(0, -105, p), a2: lerp(0, -90, p), foot: 0 }, far: { a1: -45, a2: 72, foot: 0 } },
      arms: { near: { a1: lerp(8, -44, p), a2: lerp(2, -44, p), hand: lerp(2, -44, p) }, far: { a1: lerp(10, -40, p), a2: lerp(4, -40, p), hand: lerp(4, -40, p) } },
    };
  },
} satisfies SideExercise;
