// Stand facing a cable station with the handle held at chest level in both hands.
// Rotate the rib cage to either side while the hips and feet stay stable.
// Keep the cable taut from the pulley to the handle throughout the movement.
import type { SideExercise } from '@/exercise.ts';
import { add, lerpV } from '@/math/vec2.ts';
import { BODY } from '@/rig/side.ts';
import { A, G, standLegs } from '@/exercises/common.ts';
import { cableColumn, cableHandle, cableLine, towardCable, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.35);
const COLUMN = cableColumn({ x: 75, pulleyY: 108, toward: 1 });
const HIP: [number, number] = [260, G - A - BODY.thigh - BODY.shin];
export default {
  id: 'cable-high-to-low-woodchop', name: '绳索转体', tl, poster: 0.34,
  meta: { en: 'Cable High-to-Low Woodchop', family: 'core-rotation', equipment: ['cable'], sources: ['hz:0862'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.9 }, { m: 'lowerBack', scale: 0.35 }, { m: 'forearms', side: 'both', scale: 0.25 }],
  props: (pal) => ({ back: COLUMN.draw(pal) }), propsBox: [COLUMN.box[0], 350],
  dynamic: [
    cableLine(COLUMN.pulley, (J) => J.wrist_n),
    cableHandle('d', (J) => ({ p: J.wrist_n, a: towardCable(J.wrist_n, COLUMN.pulley) })),
  ],
  pose(t) {
    const p = tl.at(t).p;
    const turn = 24 * p;
    return {
      hip: HIP, spine: { lumbar: -90 + turn * 0.35, thoracic: -90 + turn }, neck: -90 + turn, head: -90 + turn,
      legs: standLegs(260, 0),
      arms: {
        // Start at the high pulley and finish beside the opposite hip.
        near: { target: (J) => lerpV(add(J.B(0.86), [24, -52]), add(J.B(0.26), [72, 24]), p), side: [-1, 0], hand: 0 },
        far: { target: (J) => lerpV(add(J.B(0.86), [20, -49]), add(J.B(0.26), [67, 21]), p), side: [-1, 0], hand: 0 },
      },
    };
  },
} satisfies SideExercise;
