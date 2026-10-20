// Single-arm bent-over cable rear-delt row, front view. Hinge with soft knees and brace the free hand on the thigh.
// One arm rows a low-pulley handle to the upper chest with a flared elbow, then the animation shows the other side.
// The hips and feet stay fixed through both sides; the handle and cable always follow the active hand.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/front-rig.ts';
import { cableColumn, cableHandle, cableLine, frontGripAt, towardCable } from '@/exercises/equipment/index.ts';
import { hingePose, rearDeltTL, rowArm, sideSign } from './_rear-delt-1.ts';

const station = cableColumn({ x: 0, pulleyY: 350, toward: 1 });
const activeSide = (t: number): 'l' | 'r' => (t < 0.5 ? 'l' : 'r');
const phase = (t: number) => rearDeltTL.at((t % 0.5) * 2);
const tl = { total: rearDeltTL.total * 2, at: (t: number) => phase(t) };

export default {
  id: 'cable-single-arm-bent-over-rear-delt-row',
  name: '绳索单臂俯身后三角划船',
  view: 'front',
  tl,
  meta: { en: 'Cable Single-Arm Bent-Over Rear Delt Row', family: 'rear-delt', equipment: ['cable'], sources: ['hz:0202'] },
  muscles: [
    { m: 'delts', side: 'l', e: (t) => activeSide(t) === 'l' ? phase(t).e : 0.15 },
    { m: 'delts', side: 'r', e: (t) => activeSide(t) === 'r' ? phase(t).e : 0.15 },
    { m: 'traps', scale: 0.3 }, { m: 'biceps', side: 'both', scale: 0.3 },
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
      if (side === working) return rowArm(p, side, J);
      const s = sideSign(side);
      return { target: [J[`shoulder_${side}`][0] + s * 35, J[`shoulder_${side}`][1] - 100, J[`shoulder_${side}`][2] + 30], pole: [s * 0.3, 0, -1] };
    });
  },
} satisfies FrontExercise;
