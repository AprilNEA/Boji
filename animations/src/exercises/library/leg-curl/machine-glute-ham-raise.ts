// Machine glute-ham raise, side view. The knees stay just behind the pad and the toes press into the fixed footplate.
// Start from the lowered position with the knees nearly straight, then flex the knees until the torso is upright.
// The body stays straight from hips through shoulders; the knee pad, footplate, shins, and crossed hands remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math.ts';
import { baseRail, footPlate, pad, rollerEnd, tube, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.45);
const KNEE: Vec2 = [230, 390];
const angle = (t: number): number => lerp(-25, -90, tl.at(t).p);

export default {
  id: 'machine-glute-ham-raise',
  name: '器械臀腿挺身',
  tl,
  meta: { en: 'Machine Glute-Ham Raise', family: 'leg-curl', equipment: ['machine'], sources: ['fe:Glute_Ham_Raise'] },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.65 }, { m: 'calves', side: 'both', scale: 0.35 }],
  props: (pal) => ({
    back: [
      baseRail(pal, 80, 390),
      tube(pal, 'knee-post', [KNEE[0], 447], [KNEE[0], 408], { w: 14 }),
      tube(pal, 'foot-post', [132, 447], [132, 374], { dark: true, w: 14 }),
      tube(pal, 'roller-rail', [132, 374], [174, 374], { dark: true, w: 9 }),
      pad(pal, 'knee-pad', [KNEE[0], 406], [100, 27]),
      footPlate(pal, 'footplate', [118, 390], [12, 74], 0),
      ...rollerEnd(pal, 'upper-foot-roller', [140, 378], 29),
      ...rollerEnd(pal, 'lower-foot-roller', [140, 403], 29),
    ],
  }),
  propsBox: [70, 400],
  pose: (t) => {
    const a = angle(t), hip = add(KNEE, mul(dir(a), 94));
    return {
      hip,
      spine: { lumbar: a, thoracic: a },
      neck: a,
      head: a,
      legs: {
        near: { a1: a + 180, a2: 180, foot: 180 },
        far: { a1: a + 180, a2: 180, foot: 180 },
      },
      arms: {
        near: { target: (J) => add(J.B(0.58), mul(J.A(0.58), 8)), side: [0, 1], hand: 0 },
        far: { target: (J) => add(J.B(0.62), mul(J.A(0.62), 4)), side: [0, 1], hand: 0 },
      },
    };
  },
} satisfies SideExercise;
