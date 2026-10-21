// Sit near the end of a flat bench with the torso tipped slightly forward and both hands resting on the knees.
// The head lowers until the chin approaches the upper chest, then extends back in line with the fixed torso.
// The harness and its hanging plate follow the head; the bench, pelvis, feet, and torso remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import type { Joints } from '@/rig/side.ts';
import { A, G } from '@/exercises/common.ts';
import { flatBench, heldPlate } from '@/exercises/equipment/index.ts';

const tl = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.45, 1] },
  { d: 0.6, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.75, 0.38] },
  { d: 0.5, from: 0, to: 0, e: [0.32, 0.32] },
]);
const bench = flatBench({ view: 'side', x: 226, top: 92, length: 246 });
const HIP: Vec2 = [206, bench.seatY - 18];

/** The plate stays below the harness under gravity rather than rotating with the head. */
const plateCenter = (J: Joints): Vec2 => add(J.headCenter, [-5, 74]);

export default {
  id: 'head-harness-seated-neck-extension',
  name: '头带坐姿负重颈伸展',
  tl,
  meta: {
    en: 'Head Harness Seated Neck Extension', family: 'neck', equipment: ['other', 'bench', 'plate'],
    sources: ['fe:Seated_Head_Harness_Neck_Resistance'],
  },
  muscles: [{ m: 'neck' }, { m: 'traps', scale: 0.3 }],
  props: (pal) => ({ back: bench.draw(pal) }),
  propsBox: bench.box,
  dynamic: [
    {
      nm: 'Head Harness', kind: 'rigid', z: 'underNearArm',
      shapes: (pal) => [{ kind: 'ring', nm: 'harness-band', color: pal.padFar, c: [0, 0], s: [54, 46], w: 4 }],
      at: (J) => ({ p: J.headCenter, a: J.head.a }),
    },
    {
      nm: 'Harness Chain', kind: 'line', z: 'front', width: 4, color: (pal) => pal.metalDark,
      at: (J) => [add(J.headCenter, [-12, 9]), add(plateCenter(J), [0, -20])],
    },
    heldPlate<Joints>((J) => ({ p: plateCenter(J) }), 'face', 'small', 'front', 'Harness Weight'),
  ],
  poster: 0.32,
  pose(t) {
    const p = tl.at(t).p;
    return {
      hip: HIP,
      spine: { lumbar: -77, thoracic: -79 },
      // At p = 0 the chin is near the chest; p = 1 restores the neutral neck line.
      neck: lerp(-42, -79, p), head: lerp(-32, -77, p),
      legs: {
        near: { target: [HIP[0] + 105, G - A], foot: 4, side: [0, -1] },
        far: { target: [HIP[0] + 95, G - A], foot: -4, side: [0, -1] },
      },
      arms: {
        near: { target: (J) => add(J.knee_n, [-10, -4]), side: [0, 1], hand: 90 },
        far: { target: (J) => add(J.knee_f, [-2, -4]), side: [0, 1], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
