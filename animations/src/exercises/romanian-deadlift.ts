// 罗马尼亚硬拉 (romanian-deadlift). Dumbbells in front of the thighs, overhand grip.
// The knees stay softly bent, the hips travel back and the flat back hinges forward.
// The dumbbells stay close to the legs, over the middle of the feet. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { easeSinOut, lerp, lerpV, timeline } from '@/math.ts';
import { A, G, standLegs } from './common.ts';
import { dumbbell } from '@/exercises/equipment/index.ts';

const rdlTL = timeline([
  { d: 1.8, from: 0, to: 1, e: [0.3, 0.85] },
  { d: 0.3, from: 1, to: 1, e: [0.85, 0.9] },
  { d: 1.2, from: 1, to: 0, e: [1, 0.6] },
  { d: 0.6, from: 0, to: 0, e: [0.35, 0.3] },
]);

const X0 = 280; // near ankle
/** Hip joint standing and at the bottom: about 19° of knee bend, shins near vertical. */
const HIP_TOP: [number, number] = [X0 - 8, G - A - 180];
const HIP_BOTTOM: [number, number] = [X0 - 66, G - A - 169];

const romanianDeadlift = {
  id: 'romanian-deadlift', name: '罗马尼亚硬拉', tl: rdlTL,
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes' }, { m: 'lowerBack', scale: 0.5 }],
  dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')],
  pose(t) {
    const { p } = rdlTL.at(t);
    // The hips lead: they move back before the torso finishes hinging.
    const hp = easeSinOut(p);
    // Straight arms hang from the shoulders and angle back a little to keep the weights on the legs.
    const arm = lerp(84, 98, p);
    return {
      hip: lerpV(HIP_TOP, HIP_BOTTOM, hp),
      spine: { lumbar: lerp(-88, -31, p), thoracic: lerp(-90, -32, p) },
      neck: lerp(-85, -35, p), head: lerp(-87, -27, p),
      legs: standLegs(X0),
      arms: {
        near: { a1: arm, a2: arm - 2, hand: arm - 2 },
        far: { a1: arm + 1, a2: arm - 1, hand: arm - 1 },
      },
    };
  },
} satisfies Exercise;

export default romanianDeadlift;
