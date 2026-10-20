// Lie supine on the floor with both feet planted and the free arm placed beside the torso.
// Lower one neutral-grip barbell until that upper arm contacts the floor, then press to lockout.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp } from '@/math.ts';
import type { Joints } from '@/rig.ts';
import { A, G, GRIP_IN_HAND } from '@/exercises/common.ts';
import { barbell, gripAt, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.35);

export default {
  id: 'barbell-single-arm-floor-press',
  name: '杠铃单臂地板卧推',
  tl,
  mat: true,
  meta: {
    en: 'Barbell Single-Arm Floor Press', family: 'horizontal-press', equipment: ['barbell'],
    sources: ['fe:One_Arm_Floor_Press', 'hz:0065'],
  },
  muscles: [{ m: 'triceps', side: 'near' }, { m: 'pecs', scale: 0.55 }, { m: 'delts', side: 'near', scale: 0.35 }, { m: 'abs', scale: 0.25 }],
  dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
  propsBox: [92, 382],
  poster: 0.3,
  pose(t) {
    const p = tl.at(t).p;
    return {
      hip: [242, G - 30] as [number, number], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180, farHip: 0, farShoulder: 0,
      legs: {
        near: { target: [336, G - A] as [number, number], foot: 0, side: [0, -1] as [number, number] },
        far: { target: [330, G - A] as [number, number], foot: 0, side: [0, -1] as [number, number] },
      },
      arms: {
        near: { target: (J: Joints) => add(J.S, [42, lerp(-75, -121, p) + GRIP_IN_HAND]), side: [0, 1] as [number, number], hand: -90 },
        far: { a1: 0, a2: 0, hand: 0 },
      },
    };
  },
} satisfies SideExercise;
