// Cable rope squat row, side view. The athlete faces a waist-high pulley, squats with the rope extended, then rows it in.
// The chest stays lifted, both heels stay planted, and the cable remains visibly connected from pulley to rope.
import type { SideExercise } from '@/exercise.ts';
import { add, lerpV, mul } from '@/math/vec2.ts';
import type { Joints, LimbPair } from '@/rig/side.ts';
import { cableColumn, cableHandle, cableLine, gripAt, towardCable } from '@/exercises/equipment/index.ts';
import { squatPose, squatTL, X0 } from './_squat-2.ts';

const tl = squatTL(0.35);
const station = cableColumn({ x: 424, pulleyY: 294, toward: -1 });
function arms(p: number): LimbPair {
  return {
    near: {
      target: (J: Joints) => {
        const out = add(J.S, [112, 55]);
        const row = add(add(J.B(0.58), mul(J.A(0.58), 29)), mul(J.T(0.58), -8));
        return lerpV(out, row, p);
      }, side: [-1, 0], hand: 0,
    },
    far: {
      target: (J: Joints) => {
        const out = add(J.Sf, [112, 55]);
        const row = add(add(J.B(0.58), mul(J.A(0.58), 25)), mul(J.T(0.58), -11));
        return lerpV(out, row, p);
      }, side: [-1, 0], hand: 0,
    },
  };
}
export default {
  id: 'cable-rope-squat-row', name: '绳索绳把深蹲划船', tl,
  meta: { en: 'Cable Rope Squat Row', family: 'squat', equipment: ['cable', 'rope'], sources: ['hz:1717'] },
  muscles: [{ m: 'lats' }, { m: 'upperBack', scale: 0.65 }, { m: 'quads', side: 'both', scale: 0.55 }, { m: 'biceps', side: 'both', scale: 0.4 }, { m: 'glutes', scale: 0.35 }],
  props: (pal) => ({ back: station.draw(pal) }), propsBox: [X0 - 75, station.box[1]],
  dynamic: [
    cableLine(station.pulley, (J) => gripAt(J), 'Row Cable'),
    cableHandle('rope', (J) => ({ p: gripAt(J), a: towardCable(gripAt(J), station.pulley) }), { z: 'underNearArm', spread: 12 }),
  ],
  pose: (t) => { const p = tl.at(t).p; return squatPose(p, arms(p), { farDx: -6, back: 70, bottom: 105, lean: 31 }); },
} satisfies SideExercise;
