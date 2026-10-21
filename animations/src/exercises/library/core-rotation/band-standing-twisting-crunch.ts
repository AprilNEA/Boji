// Stand tall with the band around the upper back and both ends held across the chest.
// Rotate and flex the torso so one elbow travels toward the opposite hip.
// Keep both feet planted and alternate the controlled diagonal crunch.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp, lerpV } from '@/math/vec2.ts';
import { BODY } from '@/rig/side.ts';
import { A, G, standLegs } from '@/exercises/common.ts';
import { bandCurve } from '@/exercises/equipment/index.ts';
import { alternatingTL, alternate } from './_core-rotation-1.ts';

const HIP: [number, number] = [250, G - A - BODY.thigh - BODY.shin];
export default {
  id: 'band-standing-twisting-crunch', name: '弹力带站姿转体卷腹', tl: alternatingTL, poster: 0.14,
  meta: { en: 'Band Standing Twisting Crunch', family: 'core-rotation', equipment: ['band'], sources: ['hz:1007'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.85 }, { m: 'hipFlexor', side: 'both', scale: 0.3 }],
  dynamic: [bandCurve((J) => [J.B(0.77), J.wrist_f, J.B(0.77), J.wrist_n, J.B(0.77)], 'front', 'Band across back')],
  pose(t) {
    const { p, near } = alternate(t);
    const turn = (near ? 1 : -1) * 21 * p;
    const planted = standLegs(250, -4);
    const liftFrom = near ? [250, G - A] as [number, number] : [246, G - A] as [number, number];
    const raised = {
      target: lerpV(liftFrom, [HIP[0] + 54, G - A - 82], p), foot: lerp(0, -25, p), side: [1, 0] as [number, number],
    };
    return {
      hip: HIP, spine: { lumbar: -90 + turn * 0.35, thoracic: -90 + turn }, neck: -90 + turn, head: -90 + turn,
      // One foot remains planted while the opposite knee rises toward the crossing elbow.
      legs: near ? { near: raised, far: planted.far } : { near: planted.near, far: raised },
      arms: {
        near: { target: (J) => add(J.B(0.62), [18, lerp(9, 35, p)]), side: [-1, 0], hand: 45 },
        far: { target: (J) => add(J.B(0.62), [13, lerp(7, 30, p)]), side: [-1, 0], hand: 45 },
      },
    };
  },
} satisfies SideExercise;
