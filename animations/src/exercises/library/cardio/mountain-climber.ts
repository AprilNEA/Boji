// 登山者 (mountain-climber). High plank; the near knee drives toward the chest, then the far knee.
// The thigh is longer than the hip is high, so the hips rise a little while the knee passes under them.
// pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { add, ang, D2R, len, lerp, mul, norm, polar, sub, type Vec2 } from '@/math/vec2.ts';
import { easeIO, smooth, timeline } from '@/math/timeline.ts';
import { solve, type LimbSpec, type Pose } from '@/rig/side.ts';
import { plantedArm, HIGH_PLANK } from '@/exercises/common.ts';

const repTL = timeline([
  { d: 0.55, from: 0, to: 1, e: [0.35, 1] },
  { d: 0.15, from: 1, to: 1, e: [1, 0.9] },
  { d: 0.55, from: 1, to: 0, e: [0.8, 0.35] },
  { d: 0.15, from: 0, to: 0, e: [0.35, 0.3] },
]);
const climbTL = { total: repTL.total * 2 };
const climbPhase = (t: number) => {
  const r = repTL.at((t % 0.5) * 2);
  return { rep: t < 0.5 ? 0 : 1, p: r.p, e: r.e };
};

const MC = (() => {
  const th = HIGH_PLANK.top;
  const base = HIGH_PLANK.body(th);
  const arms = { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) };
  const J0 = solve({ ...base, arms });
  // Rest: straight leg on the toes. Tuck: knee under the chest, toes just above the mat.
  const rest = { a1: J0.thigh_n.a, a2: J0.shin_n.a, foot: 85 };
  const tuck = { a1: 40, flex: 146, foot: 48 };
  // Hip to shoulder and shoulder to wrist at rest. Both stay fixed while the hips rise.
  const torso = sub(J0.S, base.hip), reach = len(sub(J0.S, HIGH_PLANK.wrist));
  return { th, base, arms, shoulder: J0.S, torso, chord: len(torso), reach, rest, tuck };
})();

/** Driving leg at drive amount p (0 rest, 1 tucked). The knee bends early so the foot clears the mat. */
const driveLeg = (p: number, da = 0): LimbSpec => {
  const q = easeIO(p);
  const a1 = lerp(MC.rest.a1, MC.tuck.a1, q) + da;
  const flex = lerp(MC.rest.a2 - MC.rest.a1, MC.tuck.flex, smooth(Math.min(1, p / 0.55)));
  return { a1, a2: a1 + flex, foot: lerp(MC.rest.foot, MC.tuck.foot, q) + da };
};

/** Hip lift in px, largest while the thigh points straight down. */
const hipLift = (p: number): number => 15 * Math.exp(-(((easeIO(p) - 0.6) / 0.27) ** 2));

/** Hip raised by `lift` px on a circle around the planted ankle, so the planted leg keeps its length. */
const liftedHip = (rep: number, lift: number): Vec2 => {
  const spec = rep === 0 ? MC.base.legs.far : MC.base.legs.near;
  const ankle = spec.target as Vec2;
  const r = sub(MC.base.hip, ankle), L = len(r);
  const s = Math.max(-1, norm(r)[1] - lift / L);
  return polar(ankle, Math.asin(s) / D2R, L);
};

/** Intersection of circle (c0, r0) and circle (c1, r1) nearest to `near`. Falls back to the closest point. */
const circleMeet = (c0: Vec2, r0: number, c1: Vec2, r1: number, near: Vec2): Vec2 => {
  const d = sub(c1, c0), D = len(d);
  const a = (r0 * r0 - r1 * r1 + D * D) / (2 * D);
  const h = Math.sqrt(Math.max(0, r0 * r0 - a * a));
  const m = add(c0, mul(d, a / D)), n: Vec2 = [-d[1] / D, d[0] / D];
  const p1 = add(m, mul(n, h)), p2 = add(m, mul(n, -h));
  return len(sub(p1, near)) < len(sub(p2, near)) ? p1 : p2;
};

const mountainClimber = {
  id: 'mountain-climber', name: '登山者', tl: climbTL, mat: true,
  meta: { en: 'Mountain Climber', family: 'cardio', equipment: ['bodyweight', 'mat'], sources: ['fe:Mountain_Climbers', 'hz:0630'] },
  muscles: [
    { m: 'abs', e: (t: number) => 0.55 + 0.45 * climbPhase(t).e },
    { m: 'hipFlexor', side: 'near', e: (t: number) => (climbPhase(t).rep === 0 ? climbPhase(t).e : 0.1) },
    { m: 'hipFlexor', side: 'far', e: (t: number) => (climbPhase(t).rep === 1 ? climbPhase(t).e : 0.1) },
    { m: 'delts', side: 'near', e: () => 0.4 },
  ],
  pose(t) {
    const { rep, p } = climbPhase(t);
    const planted = MC.base.legs;
    // The planted leg, the torso and the arms keep their lengths, so the hips can only rise
    // if the shoulders rock back a little on a circle around the wrists.
    const hip = liftedHip(rep, hipLift(p));
    const S = circleMeet(hip, MC.chord, HIGH_PLANK.wrist, MC.reach, MC.shoulder);
    const turn = ang(sub(S, hip)) - ang(MC.torso);
    return {
      ...HIGH_PLANK.body(MC.th + turn),
      hip,
      legs: rep === 0 ? { near: driveLeg(p), far: planted.far } : { near: planted.near, far: driveLeg(p, 1) },
      arms: MC.arms,
    } satisfies Pose;
  },
} satisfies Exercise;

export default mountainClimber;
