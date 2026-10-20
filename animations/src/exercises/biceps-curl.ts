// 哑铃弯举 (biceps-curl). Standing, underhand grip. The upper arms stay at the sides;
// only the forearms rise until the dumbbells reach the shoulders. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '../exercise.ts';
import { lerp, smooth } from '../math.ts';
import { A, G, standLegs } from './common.ts';
import { dumbbell, workTL } from './equipment.ts';

const curlTL = workTL(0.3);

const X0 = 262; // near ankle
/** Forearm direction hanging and at the top of the curl, about 145° of elbow flexion. */
const HANG = 86, TOP = -58;

const bicepsCurl = {
  id: 'biceps-curl', name: '哑铃弯举', tl: curlTL,
  muscles: [{ m: 'biceps', side: 'both' }, { m: 'delts', side: 'near', scale: 0.25 }],
  dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')],
  pose(t) {
    const { p } = curlTL.at(t);
    // Elbows drift forward a few degrees near the top, as they do without a mirror.
    const drift = 4 * smooth((p - 0.6) / 0.4);
    const fore = lerp(HANG, TOP, p);
    return {
      hip: [X0 - 6, G - A - 180],
      spine: { lumbar: -89, thoracic: -91 },
      neck: -86, head: -88,
      legs: standLegs(X0),
      arms: {
        near: { a1: 91 - drift, a2: fore, hand: fore - 6 * p },
        far: { a1: 93 - drift, a2: fore + 2, hand: fore + 2 - 6 * p },
      },
    };
  },
} satisfies Exercise;

export default bicepsCurl;
