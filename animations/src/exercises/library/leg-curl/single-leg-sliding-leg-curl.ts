// Single-leg sliding leg curl, side view. The back stays on the floor while one heel slides on a towel and the other leg stays straight.
// The moving knee flexes from nearly straight to a compact curl without lifting the heel from the floor.
// One loop shows the near leg, then the far leg, and both towels return to the extended start at the seam.
import type { SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math.ts';
import { A, FLOOR } from '@/exercises/common.ts';
import { workTL } from '@/exercises/equipment/index.ts';

const repTL = workTL(0.35);
const tl = { total: repTL.total * 2, at: (t: number) => repTL.at((t < 0.5 ? t : t - 0.5) * 2) };
const phase = (t: number) => ({ near: t < 0.5, ...tl.at(t) });
const NECK: Vec2 = [126, FLOOR - 18];
const HIP = add(NECK, mul(dir(-3.8), 123.7));
const heel = (p: number): Vec2 => [lerp(432, 342, p), FLOOR - A];

export default {
  id: 'single-leg-sliding-leg-curl',
  name: '单腿滑动腿弯举',
  tl,
  meta: { en: 'Single-Leg Sliding Leg Curl', family: 'leg-curl', equipment: ['other'], sources: ['fe:Platform_Hamstring_Slides'] },
  muscles: [
    { m: 'hamstrings', side: 'near', e: (t) => phase(t).near ? phase(t).e : 0 },
    { m: 'hamstrings', side: 'far', e: (t) => phase(t).near ? 0 : phase(t).e },
    { m: 'glutes', scale: 0.4 },
  ],
  dynamic: [
    {
      nm: 'Near Sliding Towel', z: 'front', kind: 'rigid',
      shapes: (pal) => [{ kind: 'box', nm: 'towel', color: pal.propLight, c: [0, 9], s: [38, 7], r: 3 }],
      at: (J) => ({ p: J.ankle_n }),
    },
    {
      nm: 'Far Sliding Towel', z: 'back', kind: 'rigid',
      shapes: (pal) => [{ kind: 'box', nm: 'towel', color: pal.propLight, c: [0, 9], s: [38, 7], r: 3 }],
      at: (J) => ({ p: J.ankle_f }),
    },
  ],
  pose: (t) => {
    const r = phase(t), near = heel(r.near ? r.p : 0), far = heel(r.near ? 0 : r.p);
    return {
      hip: HIP,
      spine: { target: NECK, side: [0, 1] },
      neck: 182,
      head: 181,
      legs: {
        near: { target: near, foot: 0, side: [0, -1] },
        far: { target: [far[0] - 4, far[1]], foot: 0, side: [0, -1] },
      },
      arms: { near: { a1: 8, a2: 1, hand: 0 }, far: { a1: 7, a2: 0, hand: 0 } },
    };
  },
} satisfies SideExercise;
