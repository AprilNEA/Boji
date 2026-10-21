// Start tall with the feet planted and the loaded bar held at the upper thighs.
// Hinge and roll the bar away into a long, braced position, then pull it back to standing.
import type { SideExercise } from '@/exercise.ts';
import { hipForShoulder, standLegs } from '@/exercises/common.ts';
import { barbell, gripAt, PLATE, workTL } from '@/exercises/equipment/index.ts';
import { lerp } from '@/math/vec2.ts';

const tl = workTL(0.55);
const X = 250;

export default {
  id: 'barbell-standing-rollout',
  name: '杠铃站姿健腹滚动',
  tl,
  meta: { en: 'Barbell Standing Rollout', family: 'core-stability', equipment: ['barbell'], sources: ['hz:0103'] },
  muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.45 }, { m: 'lowerBack', scale: 0.35 }],
  dynamic: [barbell({ view: 'side', plate: 'small', at: (J) => ({ p: gripAt(J, 'n') }) })],
  propsBox: [X - 60, 460],
  poster: 0.28,
  pose(t) {
    const p = tl.at(t).p;
    const a = lerp(-90, 20, p);
    const spine = { lumbar: a, thoracic: a };
    // The end shoulder remains at a full arm's length above the bar so the knees stay soft, not crouched.
    const S: [number, number] = [lerp(258, 340, p), lerp(152, 296, p)];
    const grip: [number, number] = [lerp(263, 340, p), lerp(278, 431, p)];
    return {
      hip: hipForShoulder(S, spine), spine, neck: a - 3, head: a - 2,
      legs: standLegs(X, 0),
      arms: {
        near: { target: [grip[0], grip[1] - 9], side: [-1, 0], hand: 90 },
        far: { target: (J) => [grip[0] + J.Sf[0] - J.S[0], grip[1] - 9 + J.Sf[1] - J.S[1]], side: [-1, 0], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
