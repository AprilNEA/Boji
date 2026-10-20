// 死虫式 (dead-bug). Lying on the back in tabletop; the opposite arm and leg reach out, one side after the other. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '../exercise.ts';
import { add, dir, lerp, mul, smooth, timeline, type Vec2 } from '../math.ts';
import type { LimbSpec } from '../rig.ts';
import { FLOOR } from './common.ts';

const repTL = timeline([
  { d: 1.2, from: 0, to: 1, e: [0.2, 0.9] },
  { d: 0.6, from: 1, to: 1, e: [0.9, 1] },
  { d: 1.1, from: 1, to: 0, e: [0.8, 0.25] },
  { d: 0.4, from: 0, to: 0, e: [0.25, 0.2] },
]);
const deadBugTL = { total: repTL.total * 2 };
const deadBugPhase = (t: number) => {
  const r = repTL.at((t % 0.5) * 2);
  return { rep: t < 0.5 ? 0 : 1, p: r.p, e: r.e };
};

// Same floor contact as the glute bridge at rest: neck base and hips on the mat.
const NECK: Vec2 = [150, FLOOR - 18];
const HIP = add(NECK, mul(dir(-3.8), 123.7));

/** q = 0: arm points at the ceiling. q = 1: arm reaches past the head, just above the mat. */
const armAt = (q: number, da = 0): LimbSpec => ({ a1: lerp(-90, -167, q) + da, a2: lerp(-90, -170, q) + da, hand: lerp(-90, -172, q) + da });
/** q = 0: tabletop, thigh vertical and shin level. q = 1: leg straight, just above the mat. */
const legAt = (q: number, da = 0): LimbSpec => ({ a1: lerp(-90, -11, q) + da, a2: lerp(0, -11, q) + da, foot: lerp(-85, -75, q) + da });

const deadBug = {
  id: 'dead-bug', name: '死虫式', tl: deadBugTL, mat: true,
  muscles: [
    { m: 'abs', e: (t: number) => 0.35 + 0.65 * deadBugPhase(t).e },
    { m: 'hipFlexor', side: 'near', scale: 0.6, e: (t: number) => (deadBugPhase(t).rep === 0 ? deadBugPhase(t).e : 0) },
    { m: 'hipFlexor', side: 'far', scale: 0.6, e: (t: number) => (deadBugPhase(t).rep === 1 ? deadBugPhase(t).e : 0) },
  ],
  pose(t) {
    const { rep, p } = deadBugPhase(t);
    const q = smooth(p);
    return {
      hip: HIP,
      spine: { target: NECK, side: [0, 1] },
      neck: 182, head: 181,
      // Rep 0: far arm and near leg. Rep 1: near arm and far leg.
      legs: rep === 0 ? { near: legAt(q), far: legAt(0, 2) } : { near: legAt(0), far: legAt(q, 2) },
      arms: rep === 0 ? { near: armAt(0), far: armAt(q, 2) } : { near: armAt(q), far: armAt(0, 2) },
    };
  },
} satisfies Exercise;

export default deadBug;
