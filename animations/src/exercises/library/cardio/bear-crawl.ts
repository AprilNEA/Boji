// Bear crawl, side view. The knees hover below a flat back while opposite hand and foot advance together.
// Supporting hands stay under the shoulders and supporting toes stay on the mat during each diagonal step.
import type { SideExercise } from '@/exercise.ts';
import { FLOOR, QUAD } from '@/exercises/common.ts';

const TAU = Math.PI * 2;
const rise = (x: number): number => Math.max(0, x);

export default {
  id: 'bear-crawl',
  name: '熊爬',
  tl: { total: 1.2, at: (t) => ({ p: 0, e: 1, u: t, seg: { d: 1.2, from: 0, to: 0, e: [1, 1] } }) },
  poster: 0.25,
  mat: true,
  meta: { en: 'Bear Crawl', family: 'cardio', equipment: ['bodyweight', 'mat'], sources: ['hz:3360'] },
  muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.6 }, { m: 'triceps', side: 'both', scale: 0.45 }, { m: 'hipFlexor', side: 'both', scale: 0.4 }],
  pose(t) {
    const s = Math.sin(TAU * t);
    const n = rise(s), f = rise(-s);
    // The diagonal pair that swings lifts clear; the other pair remains planted.
    // The QUAD base was solved for planted hands. A short forward swing remains well inside arm reach.
    const hand = (forward: number, lift: number) => ({ target: [QUAD.wrist[0] + 12 * forward, FLOOR - 7 - 18 * lift] as [number, number], side: [-1, 0] as [number, number], hand: 0 });
    const foot = (forward: number, lift: number) => ({ target: [115 + 20 * forward, FLOOR - 41 - 20 * lift] as [number, number], side: [1, 0] as [number, number], foot: lift > 0.01 ? 45 : 85 });
    return {
      hip: QUAD.hip, spine: QUAD.spine, neck: -12, head: -10, farHip: 0, farShoulder: 0,
      legs: { near: foot(-1, f), far: foot(1, n) },
      arms: { near: hand(1, n), far: hand(-1, f) },
    };
  },
} satisfies SideExercise;
