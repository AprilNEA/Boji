// Lie prone and straight on a flat bench, with the upper chest supported while the neck and face extend past its end.
// Lower the head in a small yes-motion, then extend it back in line with the fixed torso while both hands secure the plate.
// The plate stays on the back of the head; the bench contact, torso, hips, and straight legs do not move.
import type { SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { BODY, rotateLocal, type Joints } from '@/rig/side.ts';
import { flatBench, heldPlate } from '@/exercises/equipment/index.ts';

const tl = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.45, 1] },
  { d: 0.6, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.75, 0.38] },
  { d: 0.5, from: 0, to: 0, e: [0.32, 0.32] },
]);
// The right end is just behind the shoulders. The neck and head project beyond it while the feet remain supported.
const bench = flatBench({ view: 'side', x: 170, top: 100, length: 340 });
const HIP: Vec2 = [220, bench.seatY - 18];

// Local +x is posterior on the head, so the plate stays on the occiput through the nod.
const BACK_OF_HEAD: Vec2 = [30, 0];
const plateCenter = (J: Joints): Vec2 => add(J.headCenter, rotateLocal(BACK_OF_HEAD, J.head.a));
/** Reconstruct the moving plate center before arm IK solves the wrists. */
const plateTarget = (J: Joints, neck: number, head: number): Vec2 =>
  add(add(add(J.N, mul(dir(neck), BODY.neck)), rotateLocal([-1, 23], head)), rotateLocal(BACK_OF_HEAD, head));

export default {
  id: 'weight-plate-prone-neck-extension',
  name: '杠铃片俯卧颈部伸展',
  tl,
  meta: {
    en: 'Weight Plate Prone Neck Extension', family: 'neck', equipment: ['bench', 'plate'],
    sources: ['fe:Lying_Face_Down_Plate_Neck_Resistance'],
  },
  muscles: [{ m: 'neck' }, { m: 'traps', scale: 0.3 }],
  props: (pal) => ({ back: bench.draw(pal) }),
  propsBox: [bench.box[0], 410],
  // A face-on plate keeps the loaded implement, its rim, and its center hole legible in the compact side-view sheet.
  dynamic: [heldPlate<Joints>((J) => ({ p: plateCenter(J) }), 'face', 'small', 'underNearArm', 'Head Plate')],
  poster: 0.32,
  pose(t) {
    const p = tl.at(t).p;
    const neck = lerp(34, 0, p), head = lerp(36, 0, p);
    return {
      hip: HIP,
      spine: { lumbar: 0, thoracic: 0 },
      // The lowered position flexes the head 34° toward the bench; p = 1 is the neutral, extended start line.
      neck, head,
      legs: {
        near: { a1: 180, a2: 180, foot: 180 },
        far: { a1: 180, a2: 180, foot: 180 },
      },
      arms: {
        near: { target: (J) => add(plateTarget(J, neck, head), [13, 1]), side: [0, -1], hand: -90 },
        far: { target: (J) => add(plateTarget(J, neck, head), [-12, -3]), side: [0, -1], hand: -90 },
      },
    };
  },
} satisfies SideExercise;
