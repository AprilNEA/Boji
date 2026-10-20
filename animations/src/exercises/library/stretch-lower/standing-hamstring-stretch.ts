// Standing hamstring stretch, side view. One leg steps forward and stays long while the hips hinge over it.
// Both hands reach down the front shin without rounding the back.
// The rear foot remains a stable support point throughout the hold.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;

export default {
  id: 'standing-hamstring-stretch',
  name: '站姿腘绳肌拉伸',
  tl,
  meta: { en: 'Standing Hamstring Stretch', family: 'stretch-lower', equipment: ['bodyweight'], sources: ['hz:1511'] },
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'glutes', scale: 0.4 }],
  pose(t) {
    const p = tl.at(t).p;
    return {
      hip: [lerp(264, 258, p), lerp(255, 299, p)],
      spine: { lumbar: lerp(-90, -10, p), thoracic: lerp(-90, -13, p) },
      neck: lerp(-90, -13, p), head: lerp(-88, -14, p),
      legs: {
        // The forward knee only softens enough for the hands to approach the shin.
        near: { a1: lerp(90, 64, p), a2: lerp(90, 35, p), foot: 0 },
        far: { a1: lerp(90, 133, p), a2: lerp(90, 51, p), foot: 0 },
      },
      arms: {
        near: { a1: lerp(90, 110, p), a2: lerp(90, 110, p), hand: lerp(90, 96, p) },
        far: { a1: lerp(92, 112, p), a2: lerp(92, 112, p), hand: lerp(92, 98, p) },
      },
    };
  },
} satisfies SideExercise;
