// Start in a forearm side plank with feet stacked and the elbow directly below the shoulder.
// Keep the trunk long while the top straight leg lifts about 50° toward the ceiling.
// The forearm, lower foot and pelvis remain steady; both supplied records describe this visible motion.
import type { FrontExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { add3 } from '@/math/vec3.ts';
import { BODY } from '@/rig/side.ts';
import { toeDir } from '@/rig/front.ts';
import { workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.45);

export default {
  id: 'bodyweight-side-plank-hip-abduction',
  name: '侧平板支撑髋外展',
  view: 'front',
  tl,
  mat: true,
  meta: {
    en: 'Bodyweight Side Plank Hip Abduction', family: 'hip-abduction-adduction', equipment: ['bodyweight', 'mat'],
    sources: ['hz:1774', 'hz:1775'],
  },
  muscles: [{ m: 'abductors', side: 'r' }, { m: 'obliques', scale: 0.65 }, { m: 'glutes', scale: 0.45, region: { view: 'front', part: 'pelvis', c: [-12, -3], s: [16, 19] } }],
  pose(t) {
    const p = tl.at(t).p;
    return {
      // Positive roll puts the body length across the screen, with the hip and shoulder pairs stacked.
      pelvis: [0, 80, 0], hips: { roll: 90 }, spine: { roll: 2 }, neck: { roll: -2 }, head: { roll: -2 },
      legs: {
        l: { target: [-176, BODY.ankleH, 0], dir: toeDir([-1, 0, 0]) },
        // The top foot arcs upward from the stacked-foot start while the knee remains nearly straight.
        r: { target: [lerp(-162, -120, p), lerp(BODY.ankleH, 236, p), -3], dir: toeDir([-1, 0, 0]) },
      },
      arms: {
        l: { target: (J) => [J.shoulder_l[0] - 16, 8, J.shoulder_l[2] + 4] },
        r: { target: (J) => add3(J.hip_r, [-6, 10, 28]) },
      },
    };
  },
} satisfies FrontExercise;
