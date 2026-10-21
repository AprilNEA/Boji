// Start in a long lunge with the front foot flat and the rear toes on the mat.
// Fold over the front leg to place the elbow near the instep, then lengthen that knee.
// The front foot and rear toe stay fixed while the torso and arms make each phase clear.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { FLOOR } from '@/exercises/common.ts';

const tl = timeline([
  { d: 1.6, from: 0, to: 1, e: [0.3, 0.8] },
  { d: 2.6, from: 1, to: 1, e: [0.8, 1] },
  { d: 2.4, from: 1, to: 2, e: [1, 0.85] },
  { d: 1.8, from: 2, to: 0, e: [0.8, 0.3] },
]);

export default {
  id: 'worlds-greatest-stretch', name: '世界最佳拉伸', tl, mat: true, poster: 0.35,
  meta: { en: "World's Greatest Stretch", family: 'stretch-lower', equipment: ['bodyweight', 'mat'], sources: ['fe:Worlds_Greatest_Stretch', 'hz:1604'] },
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'glutes', side: 'near', scale: 0.5 }, { m: 'quads', side: 'far', scale: 0.4 }, { m: 'calves', side: 'near', scale: 0.3 }],
  pose(t) {
    const phase = tl.at(t).p;
    const elbow = Math.min(phase, 1);
    const hamstring = Math.max(phase - 1, 0);
    return {
      hip: [lerp(250, 238, elbow) + 12 * hamstring, lerp(310, 325, elbow) - 35 * hamstring],
      spine: { lumbar: lerp(-90, -8, elbow) + 3 * hamstring, thoracic: lerp(-90, -10, elbow) + 3 * hamstring },
      neck: lerp(-90, -12, elbow) + 3 * hamstring, head: lerp(-88, -13, elbow) + 3 * hamstring,
      legs: {
        near: { target: [350, FLOOR - 13], side: [1, 0], foot: hamstring ? -38 : 0 },
        far: { a1: 120, a2: 155, foot: 85 },
      },
      arms: {
        near: { a1: lerp(45, 103, elbow), a2: lerp(45, 103, elbow), hand: lerp(45, 103, elbow) },
        far: { a1: lerp(48, 106, elbow), a2: lerp(48, 106, elbow), hand: lerp(48, 106, elbow) },
      },
    };
  },
} satisfies SideExercise;
