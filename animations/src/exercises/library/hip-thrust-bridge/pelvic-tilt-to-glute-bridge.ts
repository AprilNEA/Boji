// Start supine with heels under the knees and the full spine on the floor.
// First curl only the tailbone upward, then continue into a full glute bridge.
// The neck and both feet stay grounded for the full sequence.
import type { SideExercise } from '@/exercise.ts';
import { timeline } from '@/math/timeline.ts';
import { bridgePose } from './_hip-thrust-bridge.ts';

const tl = timeline([
  { d: 0.8, from: 0, to: 0.18, e: [0.25, 0.55] },
  { d: 0.45, from: 0.18, to: 0.18, e: [0.55, 0.5] },
  { d: 1.0, from: 0.18, to: 1, e: [0.55, 1] },
  { d: 0.4, from: 1, to: 1, e: [1, 0.85] },
  { d: 1.6, from: 1, to: 0, e: [0.8, 0.3] },
  { d: 0.45, from: 0, to: 0, e: [0.3, 0.25] },
]);

export default {
  id: 'pelvic-tilt-to-glute-bridge', name: '骨盆后倾接臀桥', tl, mat: true,
  meta: { en: 'Pelvic Tilt to Glute Bridge', family: 'hip-thrust-bridge', equipment: ['bodyweight', 'mat'], sources: ['fe:Pelvic_Tilt_Into_Bridge', 'hz:1422'] },
  muscles: [{ m: 'glutes' }, { m: 'lowerBack', scale: 0.7 }, { m: 'abs', scale: 0.35 }, { m: 'hamstrings', side: 'both', scale: 0.45 }],
  pose: (t) => bridgePose(tl.at(t).p),
} satisfies SideExercise;
