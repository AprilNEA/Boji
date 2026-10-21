// Stand facing the cable machine with both hands on a chest-height handle.
// Rotate through the hips and torso as the handle travels up and over one shoulder.
// Pivot the rear foot naturally, then reverse the movement and alternate sides.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp } from '@/math/vec2.ts';
import { BODY } from '@/rig/side.ts';
import { A, G, standLegs, toesDown } from '@/exercises/common.ts';
import { cableColumn, cableHandle, cableLine, towardCable } from '@/exercises/equipment/index.ts';
import { alternatingTL, alternate } from './_core-rotation-1.ts';

const COLUMN = cableColumn({ x: 75, pulleyY: 250, toward: 1 });
const HIP: [number, number] = [260, G - A - BODY.thigh - BODY.shin];
export default {
  id: 'cable-judo-flip', name: '绳索柔道转体', tl: alternatingTL, poster: 0.14,
  meta: { en: 'Cable Judo Flip', family: 'core-rotation', equipment: ['cable'], sources: ['hz:0174'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.9 }, { m: 'delts', side: 'both', scale: 0.5 }, { m: 'forearms', side: 'both', scale: 0.3 }],
  props: (pal) => ({ back: COLUMN.draw(pal) }), propsBox: [COLUMN.box[0], 360],
  dynamic: [
    cableLine(COLUMN.pulley, (J) => J.wrist_n),
    cableHandle('d', (J) => ({ p: J.wrist_n, a: towardCable(J.wrist_n, COLUMN.pulley) })),
  ],
  pose(t) {
    const { p, near } = alternate(t);
    const turn = (near ? 1 : -1) * 25 * p;
    const base = standLegs(260, -4);
    const pivot = (x: number) => ({ target: [x, G - A - 18 * p] as [number, number], foot: toesDown(A + 18 * p), side: [1, 0] as [number, number] });
    return {
      hip: HIP, spine: { lumbar: -90 + turn * 0.3, thoracic: -90 + turn }, neck: -90 + turn, head: -90 + turn,
      // The rear ankle rises around a planted toe as the hips turn under the cable.
      legs: near ? { near: base.near, far: pivot(256) } : { near: pivot(260), far: base.far },
      arms: {
        near: { target: (J) => add(J.B(0.71), [lerp(24, 42, p), lerp(9, -58, p)]), side: [-1, 0], hand: -65 },
        far: { target: (J) => add(J.B(0.71), [lerp(18, 36, p), lerp(7, -55, p)]), side: [-1, 0], hand: -65 },
      },
    };
  },
} satisfies SideExercise;
