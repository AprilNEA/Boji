// Cable lying leg curl, side view. The torso and hips stay pressed to a bench while both ankle straps pull from a low pulley.
// The legs begin straight behind the hip and curl the heels toward the glutes to about 70° of knee flexion.
// The hands keep the front handle, and the cable remains connected to the near ankle strap.
import type { SideExercise } from '@/exercise.ts';
import { cableColumn } from '@/exercises/equipment/index.ts';
import { curlAngle, curlTL, PRONE, proneCurlPose } from './_leg-curl.ts';

const column = cableColumn({ x: 55, pulleyY: 394, toward: 1 });

export default {
  id: 'cable-lying-leg-curl',
  name: '绳索俯卧腿弯举',
  tl: curlTL,
  meta: {
    en: 'Cable Lying Leg Curl', family: 'leg-curl', equipment: ['cable', 'bench'],
    sources: ['hz:2400', 'hz:3235'],
  },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.35 }, { m: 'calves', side: 'both', scale: 0.3 }],
  props: (pal) => ({
    back: [
      ...column.draw(pal),
      ...PRONE.bench.draw(pal),
      { kind: 'box', nm: 'bench-handle', color: pal.metalDark, c: PRONE.handle, s: [34, 8], r: 4 },
    ],
  }),
  propsBox: [column.box[0], PRONE.bench.box[1]],
  dynamic: [
    {
      nm: 'Ankle Cable', z: 'back', kind: 'line', width: 2.4, color: (pal) => pal.cable,
      at: (J) => [column.pulley, J.ankle_n],
    },
    {
      nm: 'Ankle Strap', z: 'front', kind: 'rigid',
      shapes: (pal) => [{ kind: 'ring', nm: 'strap', color: pal.padFar, c: [0, 0], s: [25, 25], w: 3 }],
      at: (J) => ({ p: J.ankle_n }),
    },
  ],
  pose: (t) => proneCurlPose(curlAngle(t)),
} satisfies SideExercise;
