// Band seated leg curl, side view. Sit near the front edge of a bench with a low band anchored in front behind both ankles.
// Start with the knees straight, then lean back slightly and curl the feet beneath the bench to about 70°.
// The thighs stay on the bench and the bands remain connected to both ankles throughout the repetition.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { flatBench, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.4);
const bench = flatBench({ view: 'side', x: 180, top: 90, length: 250 });
const HIP: [number, number] = [200, 340];
const KNEE: [number, number] = [294, 340];
const ANCHOR: [number, number] = [445, 426];
const shin = (t: number): number => lerp(0, 110, tl.at(t).p);

export default {
  id: 'band-seated-leg-curl',
  name: '弹力带坐姿腿弯举',
  tl,
  meta: { en: 'Band Seated Leg Curl', family: 'leg-curl', equipment: ['band', 'bench'], sources: ['fe:Seated_Band_Hamstring_Curl'] },
  muscles: [{ m: 'hamstrings', side: 'both' }],
  props: (pal) => ({
    back: [
      ...bench.draw(pal),
      { kind: 'box', nm: 'band-anchor-base', color: pal.metalDark, c: [ANCHOR[0], 444], s: [42, 8], r: 3 },
      { kind: 'oval', nm: 'band-anchor', color: pal.metal, c: ANCHOR, s: [15, 15] },
      { kind: 'box', nm: 'seat-handle', color: pal.metalDark, c: [212, 354], s: [34, 8], r: 4 },
    ],
  }),
  propsBox: [bench.box[0], 468],
  dynamic: [
    {
      nm: 'Near Band', z: 'underNearArm', kind: 'line', width: 4.5, color: (pal) => pal.resistBand,
      at: (J) => [ANCHOR, J.ankle_n],
    },
    {
      nm: 'Far Band', z: 'back', kind: 'line', width: 4.5, color: (pal) => pal.resistBand,
      at: (J) => [ANCHOR, J.ankle_f],
    },
  ],
  pose: (t) => {
    const a = shin(t), lean = lerp(-90, -100, tl.at(t).p);
    return {
      hip: HIP,
      spine: { lumbar: lean, thoracic: lean - 2 },
      neck: -90,
      head: -90,
      legs: {
        near: { a1: 0, a2: a, foot: a - 90 },
        far: { a1: 0, a2: a, foot: a - 90 },
      },
      arms: {
        near: { target: [212, 354], side: [-1, 0.4], hand: 90 },
        far: { target: [207, 356], side: [-1, 0.4], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
