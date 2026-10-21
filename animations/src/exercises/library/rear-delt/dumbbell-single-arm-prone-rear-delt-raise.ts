// Lie chest-down on a flat bench with one dumbbell hanging close to the body and the free hand bracing the pad.
// Keep the working elbow nearly straight as the arm travels backward to torso height, then lower without trunk lift.
import type { SideExercise } from '@/exercise.ts';
import { add, ang, dir, lerp, sub, type Vec2 } from '@/math/vec2.ts';
import { type Joints } from '@/rig/side.ts';
import { dumbbell, flatBench, workTL } from '@/exercises/equipment/index.ts';
import { G } from '@/exercises/common.ts';

const tl = workTL(0.45);
const bench = flatBench({ view: 'side', x: 250, top: 138, length: 250 });

export default {
  id: 'dumbbell-single-arm-prone-rear-delt-raise',
  name: '哑铃单臂俯卧后三角平举',
  tl,
  meta: {
    en: 'Dumbbell Single-Arm Prone Rear Delt Raise', family: 'rear-delt', equipment: ['dumbbell', 'bench'], sources: ['hz:0341'],
  },
  muscles: [{ m: 'delts', side: 'near' }, { m: 'traps', scale: 0.4 }, { m: 'upperBack', scale: 0.4 }],
  props: (pal) => ({ back: bench.draw(pal) }),
  propsBox: bench.box,
  dynamic: [dumbbell('n', 'profile')],
  pose(t) {
    const p = tl.at(t).p;
    const working = (J: Joints): Vec2 => add(J.S, [lerp(4, -110, p), lerp(118, 9, p)]);
    return {
      // The chest faces the pad, with the head right and both feet planted behind the bench.
      hip: [238, G - 160], spine: { lumbar: 0, thoracic: 0 }, neck: 0, head: 0,
      legs: {
        near: { target: [130, G - 13], foot: 0, side: [0, 1] },
        far: { target: [135, G - 13], foot: 0, side: [0, 1] },
      },
      arms: {
        near: { target: working, side: (J: Joints) => dir(ang(sub(working(J), J.S)) + 90), hand: 90 },
        far: { target: [370, G - 132], side: [-1, 0.2], hand: 0 },
      },
    };
  },
} satisfies SideExercise;
