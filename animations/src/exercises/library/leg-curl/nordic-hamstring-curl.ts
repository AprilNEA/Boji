// Nordic hamstring curl, side view. The shins and ankles stay fixed under a low support while the knees stay on the mat.
// Begin upright, then lower one straight line from knees through shoulders until the hands can brace on the floor.
// The hips do not fold; the ankle anchor and knee contact remain fixed during the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math.ts';
import { FLOOR } from '@/exercises/common.ts';
import { workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.35);
const KNEE: Vec2 = [220, FLOOR - 11];
const angle = (t: number): number => lerp(-90, -25, tl.at(t).p);

export default {
  id: 'nordic-hamstring-curl',
  name: '北欧腿弯举',
  tl,
  mat: true,
  meta: {
    en: 'Nordic Hamstring Curl', family: 'leg-curl', equipment: ['bodyweight', 'other'],
    sources: ['fe:Floor_Glute-Ham_Raise', 'fe:Natural_Glute_Ham_Raise'],
  },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.45 }, { m: 'calves', side: 'both', scale: 0.3 }],
  props: (pal) => ({
    back: [
      { kind: 'box', nm: 'anchor-base', color: pal.metalDark, c: [118, FLOOR - 4], s: [124, 10], r: 3 },
      { kind: 'box', nm: 'anchor-post', color: pal.metal, c: [118, FLOOR - 28], s: [14, 42], r: 4 },
      { kind: 'oval', nm: 'ankle-anchor', color: pal.pad, c: [130, FLOOR - 23], s: [30, 30] },
      { kind: 'oval', nm: 'anchor-hub', color: pal.metalDark, c: [130, FLOOR - 23], s: [9, 9] },
    ],
  }),
  propsBox: [56, 282],
  pose: (t) => {
    const p = tl.at(t).p, a = angle(t), hip = add(KNEE, mul(dir(a), 94));
    const hand: Vec2 = [lerp(276, 431, p), lerp(275, FLOOR - 7, p)];
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
        near: { target: hand, side: [0, 1], hand: 0 },
        far: { target: [hand[0] - 4, hand[1]], side: [0, 1], hand: 0 },
      },
    };
  },
} satisfies SideExercise;
