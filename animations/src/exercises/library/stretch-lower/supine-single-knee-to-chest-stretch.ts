// Supine single-knee-to-chest stretch, side view. One leg remains extended along the mat.
// The other knee bends toward the chest and the hands hold behind that knee.
// The neck stays neutral and the lower back remains settled on the mat.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { FLOOR } from '@/exercises/common.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const HIP: [number, number] = [272, FLOOR - 26];
export default {
  id: 'supine-single-knee-to-chest-stretch', name: '仰卧单膝抱胸拉伸', tl, mat: true,
  meta: { en: 'Supine Single Knee-to-Chest Stretch', family: 'stretch-lower', equipment: ['bodyweight', 'mat'], sources: ['fe:One_Knee_To_Chest'] },
  muscles: [{ m: 'glutes', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.35 }, { m: 'lowerBack', scale: 0.35 }],
  pose(t) {
    const p = tl.at(t).p;
    return { hip: HIP, spine: { lumbar: 178, thoracic: 178 }, neck: 181, head: 181,
      legs: { near: { a1: lerp(0, -128, p), a2: lerp(0, -42, p), foot: 0 }, far: { a1: 0, a2: 0, foot: 0 } },
      arms: { near: { a1: lerp(8, -28, p), a2: lerp(2, -28, p), hand: lerp(2, -28, p) }, far: { a1: lerp(10, -25, p), a2: lerp(4, -25, p), hand: lerp(4, -25, p) } },
    };
  },
} satisfies SideExercise;
