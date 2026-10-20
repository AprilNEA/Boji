// Lie supine and straight on a flat bench, with the shoulders supported and the neck, head, and face beyond the end.
// From the lowered head position, flex the neck to return the head to its neutral line while both hands secure the forehead plate.
// The bench contact, torso, hips, and straight legs remain fixed throughout the controlled yes-motion.
import type { SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, timeline, type Vec2 } from '@/math.ts';
import { BODY, rotateLocal, type Joints } from '@/rig.ts';
import { flatBench, heldPlate } from '@/exercises/equipment/index.ts';

const tl = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.45, 1] },
  { d: 0.6, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.75, 0.38] },
  { d: 0.5, from: 0, to: 0, e: [0.32, 0.32] },
]);
// The left edge ends behind the shoulders. The head and plate are visibly unsupported beyond the pad.
const bench = flatBench({ view: 'side', x: 294, top: 100, length: 340 });
const HIP: Vec2 = [252, bench.seatY - 18];

// Local -x is anterior on the head, which keeps the plate centered on the forehead while it nods.
const FOREHEAD: Vec2 = [-30, 0];
const plateCenter = (J: Joints): Vec2 => add(J.headCenter, rotateLocal(FOREHEAD, J.head.a));
/** Reconstruct the moving plate center before arm IK solves the wrists. */
const plateTarget = (J: Joints, neck: number, head: number): Vec2 =>
  add(add(add(J.N, mul(dir(neck), BODY.neck)), rotateLocal([-1, 23], head)), rotateLocal(FOREHEAD, head));

export default {
  id: 'weight-plate-supine-neck-flexion',
  name: '杠铃片仰卧颈部屈曲',
  tl,
  meta: {
    en: 'Weight Plate Supine Neck Flexion', family: 'neck', equipment: ['bench', 'plate'],
    sources: ['fe:Lying_Face_Up_Plate_Neck_Resistance'],
  },
  muscles: [{ m: 'neck' }, { m: 'traps', scale: 0.3 }],
  props: (pal) => ({ back: bench.draw(pal) }),
  propsBox: [48, bench.box[1]],
  // A face-on plate keeps the loaded implement, its rim, and its center hole legible in the compact side-view sheet.
  dynamic: [heldPlate<Joints>((J) => ({ p: plateCenter(J) }), 'face', 'small', 'underNearArm', 'Forehead Plate')],
  poster: 0.32,
  pose(t) {
    const p = tl.at(t).p;
    const neck = lerp(145, 180, p), head = lerp(143, 180, p);
    return {
      hip: HIP,
      spine: { lumbar: 180, thoracic: 180 },
      // At p = 0 the head has lowered into extension; p = 1 flexes it back to neutral above the chest line.
      neck, head,
      legs: {
        near: { a1: 0, a2: 0, foot: 0 },
        far: { a1: 0, a2: 0, foot: 0 },
      },
      arms: {
        near: { target: (J) => add(plateTarget(J, neck, head), [12, 1]), side: [0, 1], hand: 90 },
        far: { target: (J) => add(plateTarget(J, neck, head), [-12, -3]), side: [0, 1], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
