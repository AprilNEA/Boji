// Start supine in a raised bridge with bent knees, flat feet and arms resting wide for support.
// Keep the hips elevated while both knees rotate toward one side, then the other.
// The shoulders and feet remain grounded as the lower body alternates sides.
import type { FrontExercise } from '@/exercise.ts';
import { toeDir } from '@/front-rig.ts';
import { BODY } from '@/rig.ts';

const TAU = Math.PI * 2;
const ankleY = BODY.ankleH;

export default {
  id: 'glute-bridge-with-alternating-hip-twist', name: '臀桥交替转髋', view: 'front', tl: { total: 3.2 }, mat: true, poster: 0.25,
  meta: { en: 'Glute Bridge with Alternating Hip Twist', family: 'hip-thrust-bridge', equipment: ['bodyweight', 'mat'], sources: ['hz:1466'] },
  muscles: [{ m: 'glutes', region: { view: 'front', part: 'pelvis', c: [0, 1], s: [44, 27], mirror: false }, e: () => 1 }, { m: 'obliques', region: { view: 'front', part: 'abs', c: [15, 0], s: [13, 38], mirror: true }, scale: 0.55, e: () => 0.75 }],
  pose(t) {
    const turn = 24 * Math.sin(TAU * t);
    const shift = 9 * Math.sin(TAU * t);
    return {
      // A -120° pelvis pitch puts the shoulders on the floor behind the elevated hips.
      pelvis: [shift, 80, 0], hips: { pitch: -120, yaw: turn }, spine: { yaw: -turn }, neck: { pitch: 6 }, head: { pitch: -6 },
      legs: {
        l: { target: [46, ankleY, 84], pole: [62, 8, 62], dir: toeDir([0, 0, 1]) },
        r: { target: [-46, ankleY, 84], pole: [-62, 8, 62], dir: toeDir([0, 0, 1]) },
      },
      arms: {
        l: { target: [108, ankleY, -64], pole: [52, 26, -58], dir: [1, 0, 0] },
        r: { target: [-108, ankleY, -64], pole: [-52, 26, -58], dir: [-1, 0, 0] },
      },
    };
  },
} satisfies FrontExercise;
