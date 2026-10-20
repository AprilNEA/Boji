// 鸟狗式 (bird-dog). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '../exercise.ts';
import { lerp, smooth, timeline } from '../math.ts';
import { solve, type Side } from '../rig.ts';
import { QUAD, kneelLeg, plantedArm } from './common.ts';

const repTL = timeline([
  { d: 1.1, from: 0, to: 1, e: [0.15, 0.9] },
  { d: 1.0, from: 1, to: 1, e: [0.9, 1] },
  { d: 1.1, from: 1, to: 0, e: [0.8, 0.2] },
  { d: 0.5, from: 0, to: 0, e: [0.2, 0.15] },
]);
const birdDogTL = { total: repTL.total * 2 };
const birdDogPhase = (t: number) => {
  const half = t < 0.5 ? 0 : 1;
  const r = repTL.at((t % 0.5) * 2);
  return { rep: half, p: r.p, e: r.e };
};
const birdDog = {
  id: 'bird-dog', name: '鸟狗式', tl: birdDogTL, mat: true,
  muscles: [
    { m: 'glutes', e: (t: number) => birdDogPhase(t).e },
    { m: 'lowerBack', e: (t: number) => birdDogPhase(t).e },
    { m: 'delts', side: 'near', e: (t: number) => (birdDogPhase(t).rep === 0 ? birdDogPhase(t).e : 0) },
    { m: 'delts', side: 'far', e: (t: number) => (birdDogPhase(t).rep === 1 ? birdDogPhase(t).e : 0) },
  ],
  pose(t) {
    const { rep, p } = birdDogPhase(t);
    const base = { hip: QUAD.hip, spine: QUAD.spine, neck: -12, head: -10, farShoulder: 0 };
    const probe = solve({ ...base, legs: { near: kneelLeg(QUAD.hip), far: kneelLeg(QUAD.hip) }, arms: { near: plantedArm(QUAD.wrist), far: plantedArm(QUAD.wristFar) } });
    const armAt = (sfx: Side, q: number) => ({
      a1: lerp(probe[`upper_${sfx}` as const].a, -8, q), a2: lerp(probe[`fore_${sfx}` as const].a, -8, q), hand: lerp(0, -8, q),
    });
    const legAt = (q: number) => ({ a1: lerp(90, 183, q), a2: lerp(178, 183, q), foot: lerp(180, 92, q) });
    const qa = smooth(p);
    return {
      ...base,
      farHip: 0, farShoulder: 0,
      legs: rep === 0 ? { near: kneelLeg(QUAD.hip), far: legAt(qa) } : { near: legAt(qa), far: kneelLeg(QUAD.hip) },
      arms: rep === 0
        ? { near: armAt('n', qa), far: plantedArm(QUAD.wristFar) }
        : { near: plantedArm(QUAD.wrist), far: armAt('f', qa) },
    };
  },
} satisfies Exercise;

export default birdDog;
