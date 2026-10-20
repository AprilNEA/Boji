// 婴儿式 (childs-pose). From a tabletop with the hands a little ahead of the shoulders, the hips sink back
// onto the heels. The hands stay planted, so the arms lengthen and the back rounds over the thighs.
// The pose is held for two slow breaths: the upper back rises a little on each inhale.
// pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '../exercise.ts';
import { add, dir, IK_WARNINGS, len, lerp, mul, sub, timeline, type Segment, type Vec2 } from '../math.ts';
import { BODY, solve, type Pose } from '../rig.ts';
import { FLOOR, QUAD, kneelLeg, plantedArm } from './common.ts';

const HOLD: Segment = { d: 3.6, from: 1, to: 1, e: [0.75, 0.9] };
const childTL = timeline([
  { d: 1.8, from: 0, to: 1, e: [0.2, 0.75] },
  HOLD,
  { d: 1.5, from: 1, to: 0, e: [0.9, 0.35] },
  { d: 0.7, from: 0, to: 0, e: [0.35, 0.2] },
]);

/** Shoulder to wrist distance: nearly straight arms (upper 66 + forearm 60). */
const REACH = 121;
const WRIST_Y = FLOOR - 7;

/** Hip on a circle around the planted knee: over the knee at p = 0, on the heels at p = 1. */
const hipAt = (p: number): Vec2 => add(QUAD.K, mul(dir(lerp(-95, -158, p)), BODY.thigh));

/**
 * Pose without arms. th: lumbar direction. The thoracic spine folds down as p grows.
 * The neck base ends about 29 px above the mat, so the neck reaches forward almost level
 * and the head turns face down until the forehead rests on the mat.
 */
const body = (p: number, th: number, breath = 0): Omit<Pose, 'arms'> => {
  const hip = hipAt(p);
  return {
    hip, farHip: 0, farShoulder: 0,
    spine: { lumbar: th, thoracic: th + lerp(-2, 24, p) - breath },
    neck: th + lerp(-4, 10, p) - breath, head: th + lerp(-2, 23, p) - breath,
    legs: { near: kneelLeg(hip), far: kneelLeg(hip) },
  };
};

const PROBE_ARMS = { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } };
const shoulderAt = (p: number, th: number): Vec2 => solve({ ...body(p, th), arms: PROBE_ARMS }).S;

/** Final pose: the belly rests on the thighs. The wrist sits one reach ahead of the shoulder, on the mat. */
const TH_END = -4;
const WRIST: Vec2 = (() => {
  const S = shoulderAt(1, TH_END);
  return [S[0] + Math.sqrt(REACH ** 2 - (WRIST_Y - S[1]) ** 2), WRIST_Y];
})();

/**
 * Lumbar direction that keeps the shoulder one reach from the planted wrist.
 * The arms line up with the torso at the end, so the distance has a minimum near the final angle.
 * Find that minimum first, then bisect on the upper side, where the distance falls as th grows.
 */
const solveTh = (p: number): number => {
  const n0 = IK_WARNINGS.length;
  const dist = (th: number): number => len(sub(shoulderAt(p, th), WRIST));
  let a = -60, b = 40;
  for (let i = 0; i < 40; i++) {
    const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3;
    if (dist(m1) < dist(m2)) b = m2; else a = m1;
  }
  const thMin = (a + b) / 2;
  let lo = -60, hi = thMin;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (dist(mid) > REACH) lo = mid; else hi = mid;
  }
  IK_WARNINGS.length = n0; // probe solves only
  return dist(thMin) > REACH ? thMin : (lo + hi) / 2;
};

const childsPose = {
  id: 'childs-pose', name: '婴儿式', tl: childTL, mat: true,
  muscles: [{ m: 'lowerBack', scale: 0.55 }, { m: 'lats', scale: 0.55 }],
  pose(t) {
    const ph = childTL.at(t);
    const breath = ph.seg === HOLD ? 2.2 * (1 - Math.cos(4 * Math.PI * ph.u)) / 2 : 0;
    return {
      ...body(ph.p, solveTh(ph.p), breath),
      arms: { near: plantedArm(WRIST), far: plantedArm(add(WRIST, [-3, 0])) },
    };
  },
} satisfies Exercise;

export default childsPose;
