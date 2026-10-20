// Single-arm bent-over cable reverse fly, front view. Hinge with soft knees and brace the non-working hand on the thigh.
// The active arm starts below the shoulder and opens to the side at shoulder height, then the other side repeats.
// The feet and back angle remain fixed, and the low-pulley handle stays connected to the active hand.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/front-rig.ts';
import { cableColumn, cableHandle, cableLine, frontGripAt, towardCable } from '@/exercises/equipment/index.ts';
import { flyArm, hingePose, rearDeltTL, sideSign } from './_rear-delt-1.ts';

const station = cableColumn({ x: 0, pulleyY: 350, toward: 1 });
const activeSide = (t: number): 'l' | 'r' => (t < 0.5 ? 'l' : 'r');
const phase = (t: number) => rearDeltTL.at((t % 0.5) * 2);
const tl = { total: rearDeltTL.total * 2, at: (t: number) => phase(t) };

export default {
  id: 'cable-single-arm-bent-over-reverse-fly',
  name: '绳索单臂俯身反向飞鸟',
  view: 'front',
  tl,
  meta: { en: 'Cable Single-Arm Bent-Over Reverse Fly', family: 'rear-delt', equipment: ['cable'], sources: ['fe:Bent_Over_Low-Pulley_Side_Lateral', 'hz:0191'] },
  muscles: [
    { m: 'delts', side: 'l', e: (t) => activeSide(t) === 'l' ? phase(t).e : 0.15 },
    { m: 'delts', side: 'r', e: (t) => activeSide(t) === 'r' ? phase(t).e : 0.15 },
    { m: 'traps', scale: 0.3 },
  ],
  props: (pal) => ({ back: station.draw(pal) }),
  propsBox: station.box,
  dynamic: [
    cableLine<FrontJoints>(station.pulley, (J, t) => frontGripAt(J, activeSide(t)), 'Active cable'),
    cableHandle<FrontJoints>('d', (J, t) => { const p = frontGripAt(J, activeSide(t)); return { p, a: towardCable(p, station.pulley) }; }),
  ],
  pose(t) {
    const working = activeSide(t), p = phase(t).p;
    return hingePose((side, J) => {
      if (side === working) return flyArm(p, side, J, true);
      const s = sideSign(side);
      return { target: [J[`shoulder_${side}`][0] + s * 35, J[`shoulder_${side}`][1] - 100, J[`shoulder_${side}`][2] + 30], pole: [s * 0.3, 0, -1] };
    });
  },
} satisfies FrontExercise;
