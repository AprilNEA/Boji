// Glute-ham raise, side view. The ankles and lower body are secured by the machine while the hip rests on the curved pad.
// The trunk starts lowered under control, then extends at the hips until head, torso, hips, and feet form one line.
// The feet, knees, hip pad, and crossed hands stay fixed while only the torso angle changes.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp, mul, type Vec2 } from '@/math.ts';
import { baseRail, footPlate, pad, rollerEnd, tube, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.45);
const HIP: Vec2 = [250, 320];
const KNEE: Vec2 = [180, 360];
const angle = (t: number): number => lerp(25, -30, tl.at(t).p);

export default {
  id: 'glute-ham-raise',
  name: '臀腿挺身',
  tl,
  meta: { en: 'Glute-Ham Raise', family: 'leg-curl', equipment: ['machine'], sources: ['hz:3193'] },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.75 }, { m: 'lowerBack', scale: 0.45 }],
  props: (pal) => ({
    back: [
      baseRail(pal, 66, 416),
      tube(pal, 'hip-post', [236, 447], [236, 343], { w: 15 }),
      tube(pal, 'foot-post', [108, 447], [108, 356], { dark: true, w: 14 }),
      tube(pal, 'roller-rail', [108, 343], [154, 343], { dark: true, w: 9 }),
      pad(pal, 'hip-pad', [238, 338], [86, 27]),
      footPlate(pal, 'footplate', [90, 362], [12, 74], 0),
      ...rollerEnd(pal, 'upper-ankle-roller', [111, 345], 29),
      ...rollerEnd(pal, 'lower-ankle-roller', [111, 371], 29),
    ],
  }),
  propsBox: [58, 425],
  pose: (t) => {
    const a = angle(t);
    return {
      hip: HIP,
      spine: { lumbar: a, thoracic: a },
      neck: a,
      head: a,
      legs: {
        near: { a1: 150, a2: 180, foot: 180 },
        far: { a1: 150, a2: 180, foot: 180 },
      },
      arms: {
        near: { target: (J) => add(J.B(0.58), mul(J.A(0.58), 8)), side: [0, 1], hand: 0 },
        far: { target: (J) => add(J.B(0.62), mul(J.A(0.62), 4)), side: [0, 1], hand: 0 },
      },
    };
  },
} satisfies SideExercise;
