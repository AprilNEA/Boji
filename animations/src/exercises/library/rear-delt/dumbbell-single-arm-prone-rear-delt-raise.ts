// Lie chest-down on a flat bench with one dumbbell hanging close to the body and the free hand bracing the pad.
// Keep the working elbow nearly straight as the arm travels backward to torso height, then lower without trunk lift.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math.ts';
import { type Joints } from '@/rig.ts';
import { dumbbell, flatBench, workTL } from '@/exercises/equipment/index.ts';
import { G } from '@/exercises/common.ts';

const tl = workTL(0.45);
const bench = flatBench({ view: 'side', x: 250, top: 138, length: 225 });

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
      // The torso is level and stays fixed on the pad. The legs remain long and planted beyond the bench.
      hip: [282, G - 160], spine: { lumbar: -171, thoracic: -171 }, neck: -171, head: -171,
      legs: {
        near: { target: [370, G - 13], foot: 0, side: [0, 1] },
        far: { target: [364, G - 13], foot: 0, side: [0, 1] },
      },
      arms: {
        near: { target: working, side: [-1, 0.2], hand: 90 },
        far: { target: (J: Joints) => add(J.Sf, [42, 52]), side: [-1, 0.2], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
