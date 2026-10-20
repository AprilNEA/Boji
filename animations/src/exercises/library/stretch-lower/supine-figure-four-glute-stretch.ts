// Supine figure-four glute stretch, side view. The near ankle crosses above the opposite knee.
// Both hands draw the supporting thigh toward the chest while the neck stays relaxed.
// The crossed knee opens outward to make the figure-four shape readable.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { FLOOR } from '@/exercises/common.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const HIP: [number, number] = [272, FLOOR - 26];
export default {
  id: 'supine-figure-four-glute-stretch', name: '仰卧四字臀肌拉伸', tl, mat: true,
  meta: { en: 'Supine Figure-Four Glute Stretch', family: 'stretch-lower', equipment: ['bodyweight', 'mat'], sources: ['fe:Ankle_On_The_Knee', 'hz:1709', 'hz:1710'] },
  muscles: [{ m: 'glutes', side: 'near' }, { m: 'hamstrings', side: 'far', scale: 0.3 }],
  pose(t) {
    const p = tl.at(t).p;
    return { hip: HIP, spine: { lumbar: 178, thoracic: 178 }, neck: 181, head: 181,
      // The crossed-leg transition is not drawable as a simple angle interpolation: it drives the ankle through
      // the mat. Keep the recognizable held figure-four position for the full calm static-stretch loop.
      legs: { near: { a1: -28, a2: 128, foot: 0 }, far: { a1: -94, a2: -20, foot: 0 } },
      arms: { near: { a1: lerp(8, -28, p), a2: lerp(2, -28, p), hand: lerp(2, -28, p) }, far: { a1: lerp(10, -25, p), a2: lerp(4, -25, p), hand: lerp(4, -25, p) } },
    };
  },
} satisfies SideExercise;
