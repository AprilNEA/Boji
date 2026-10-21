// Lie face down with the chest on a 45-degree incline and hang the neutral-grip dumbbells vertically.
// Raise both softly bent arms forward and upward into a Y in line with the torso, then lower them under control.
// The chest stays on the pad and both feet stay on the floor throughout the repetition.
import type { SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul } from '@/math/vec2.ts';
import { BODY, type Joints, type LimbSpec, type Pose } from '@/rig/side.ts';
import { A, G } from '@/exercises/common.ts';
import { dumbbell, inclineBench, workTL } from '@/exercises/equipment/index.ts';

const REACH = BODY.upper + BODY.fore - 3;
const bench = inclineBench({ x: 242, angle: 45, facing: -1 });
const base: Omit<Pose, 'arms'> = {
  hip: [244, G - 111], spine: { lumbar: -46, thoracic: -45 }, neck: -44, head: -43,
  legs: {
    near: { target: [398, G - A], foot: 0, side: [0, -1] },
    far: { target: [392, G - A], foot: 0, side: [0, -1] },
  },
};

const yArm = (p: number, far: boolean): LimbSpec => ({
  target: (J: Joints) => add(far ? J.Sf : J.S, mul(dir(lerp(90, -45, p)), REACH)),
  side: [1, 1], hand: 90,
});

const tl = workTL(0.35);

export default {
  id: 'dumbbell-incline-y-raise', name: '哑铃上斜Y字上举', tl,
  meta: { en: 'Dumbbell Incline Y Raise', family: 'rotator-cuff', equipment: ['dumbbell', 'bench'], sources: ['hz:3541'] },
  muscles: [{ m: 'upperBack', scale: 1 }, { m: 'delts', side: 'both', scale: 0.65 }],
  props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box, poster: 0.31,
  dynamic: [dumbbell('n', 'profile'), dumbbell('f', 'profile')],
  pose(t) {
    const p = tl.at(t).p;
    return { ...base, arms: { near: yArm(p, false), far: yArm(p, true) } };
  },
} satisfies SideExercise;
