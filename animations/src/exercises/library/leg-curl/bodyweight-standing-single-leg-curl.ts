// Standing single-leg curl, side view. Each repetition shifts weight to one straight support leg while the other heel curls up.
// The moving knee goes from straight to about 70°; the upper leg stays vertical and the hands remain on the hips.
// One loop shows the near leg, then the far leg, with both feet grounded at the switch and loop seam.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { G, handOnHip } from '@/exercises/common.ts';
import { workTL } from '@/exercises/equipment/index.ts';

const repTL = workTL(0.35);
const tl = { total: repTL.total * 2, at: (t: number) => repTL.at((t < 0.5 ? t : t - 0.5) * 2) };
const phase = (t: number) => ({ near: t < 0.5, ...tl.at(t) });
const shin = (p: number): number => lerp(90, 200, p);

export default {
  id: 'bodyweight-standing-single-leg-curl',
  name: '徒手站姿单腿弯举',
  tl,
  meta: { en: 'Bodyweight Standing Single-Leg Curl', family: 'leg-curl', equipment: ['bodyweight'], sources: ['hz:0795'] },
  muscles: [
    { m: 'hamstrings', side: 'near', e: (t) => phase(t).near ? phase(t).e : 0 },
    { m: 'hamstrings', side: 'far', e: (t) => phase(t).near ? 0 : phase(t).e },
    { m: 'glutes', scale: 0.35 },
  ],
  pose: (t) => {
    const r = phase(t), nearShin = r.near ? shin(r.p) : 90, farShin = r.near ? 90 : shin(r.p);
    return {
      hip: [260, G - 197],
      spine: { lumbar: -90, thoracic: -90 },
      neck: -90,
      head: -90,
      legs: {
        near: { a1: 90, a2: nearShin, foot: 0 },
        far: { a1: 90, a2: farShin, foot: 0 },
      },
      arms: { near: handOnHip(0), far: handOnHip(-5) },
    };
  },
} satisfies SideExercise;
